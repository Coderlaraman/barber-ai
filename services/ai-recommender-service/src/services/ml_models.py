"""
Modelos de Machine Learning para recomendaciones
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import TruncatedSVD
from sklearn.neighbors import NearestNeighbors
import pickle
from datetime import datetime

from ..models.recommendation import UserProfile, BarberProfile

logger = logging.getLogger(__name__)

class CollaborativeFilteringModel:
    """
    Modelo de filtrado colaborativo para recomendaciones
    Basado en usuarios similares y factorización de matrices
    """
    
    def __init__(self, n_components: int = 50, n_iter: int = 10, random_state: int = 42):
        self.model = None
        self.user_encoder = LabelEncoder()
        self.item_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.is_trained = False
        self.user_features = {}
        self.item_features = {}
        self.n_components = n_components
        self.n_iter = n_iter
        self.random_state = random_state
        self.similarity_threshold = 0.7  # Umbral optimizado para similitud
        
    def train(self, training_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Entrenar el modelo con datos históricos
        """
        try:
            logger.info("Entrenando modelo de filtrado colaborativo...")
            
            ratings = training_data.get('ratings', [])
            if not ratings:
                logger.warning("No hay datos de ratings para entrenar")
                return {"status": "no_data", "message": "No hay suficientes datos de entrenamiento"}
            
            # Preparar datos
            df_ratings = pd.DataFrame(ratings)
            if len(df_ratings) < 10:
                logger.warning("Datos insuficientes para entrenamiento significativo")
                return {"status": "insufficient_data", "n_samples": len(df_ratings)}
            
            # Codificar usuarios e items
            df_ratings['user_encoded'] = self.user_encoder.fit_transform(df_ratings['user_id'])
            df_ratings['item_encoded'] = self.item_encoder.fit_transform(df_ratings['item_id'])
            
            # Crear matriz de ratings
            n_users = len(self.user_encoder.classes_)
            n_items = len(self.item_encoder.classes_)
            
            rating_matrix = np.zeros((n_users, n_items))
            
            for _, row in df_ratings.iterrows():
                user_idx = row['user_encoded']
                item_idx = row['item_encoded']
                rating_matrix[user_idx, item_idx] = row['rating']
            
            # Aplicar SVD para factorización de matrices con hiperparámetros optimizados
            optimal_components = min(min(n_users, n_items) - 1, self.n_components)
            optimal_components = max(optimal_components, 10)  # Mínimo 10 componentes
            
            self.model = TruncatedSVD(
                n_components=optimal_components,
                n_iter=self.n_iter,
                random_state=self.random_state
            )
            
            # Entrenar modelo
            self.model.fit(rating_matrix)
            self.is_trained = True
            
            # Calcular métricas de evaluación
            train_score = self.model.score(rating_matrix)
            
            logger.info(f"Modelo entrenado exitosamente. Score: {train_score:.4f}")
            
            return {
                "status": "success",
                "n_users": n_users,
                "n_items": n_items,
                "n_components": n_components,
                "train_score": train_score,
                "n_samples": len(df_ratings)
            }
            
        except Exception as e:
            logger.error(f"Error entrenando modelo colaborativo: {e}")
            return {"status": "error", "message": str(e)}
    
    def predict_rating(self, user_id: str, item_id: str, 
                      user_profile: Optional[UserProfile] = None,
                      item_profile: Optional[BarberProfile] = None) -> float:
        """
        Predecir rating para un usuario-item específico
        """
        try:
            if not self.is_trained:
                logger.warning("Modelo no entrenado, usando predicción por defecto")
                return self._default_prediction(user_id, item_id)
            
            # Verificar si el usuario/item existe en el entrenamiento
            try:
                user_encoded = self.user_encoder.transform([user_id])[0]
                item_encoded = self.item_encoder.transform([item_id])[0]
            except ValueError:
                # Usuario/item nuevo - usar cold start strategy
                return self._cold_start_prediction(user_id, item_id, user_profile, item_profile)
            
            # Preparar vector de usuario
            n_items = len(self.item_encoder.classes_)
            user_vector = np.zeros((1, n_items))
            
            # Si hay datos históricos del usuario, usarlos
            if hasattr(self, 'rating_matrix'):
                user_vector[0] = self.rating_matrix[user_encoded]
            
            # Transformar con SVD
            user_transformed = self.model.transform(user_vector)
            components = self.model.components_
            
            # Predecir rating
            predicted_rating = np.dot(user_transformed[0], components[:, item_encoded])
            
            # Normalizar a rango 0-1
            return max(0.0, min(1.0, (predicted_rating + 1) / 2.0))
            
        except Exception as e:
            logger.error(f"Error prediciendo rating: {e}")
            return 0.5  # Valor por defecto
    
    def _default_prediction(self, user_id: str, item_id: str) -> float:
        """Predicción por defecto cuando el modelo no está entrenado"""
        # Usar promedio global simple
        return 0.6  # Score neutro por defecto
    
    def _cold_start_prediction(self, user_id: str, item_id: str,
                               user_profile: Optional[UserProfile] = None,
                               item_profile: Optional[BarberProfile] = None) -> float:
        """Estrategia para usuarios/items nuevos (cold start)"""
        try:
            score = 0.5  # Base neutra
            
            # Si hay perfiles, usar información adicional
            if user_profile and item_profile:
                # Similaridad básica basada en preferencias
                if hasattr(user_profile, 'style_preferences') and item_profile.specialties:
                    common_preferences = set(user_profile.style_preferences) & set(item_profile.specialties)
                    if common_preferences:
                        score += 0.2 * len(common_preferences) / max(len(user_profile.style_preferences), 1)
                
                # Ajustar por rating promedio del item
                if item_profile.rating:
                    score += 0.1 * (item_profile.rating - 3.0) / 2.0  # Normalizar rating
            
            return max(0.0, min(1.0, score))
            
        except Exception as e:
            logger.error(f"Error en cold start prediction: {e}")
            return 0.5
    
    def get_similar_users(self, user_id: str, n_similar: int = 5) -> List[str]:
        """Obtener usuarios similares basados en preferencias"""
        try:
            if not self.is_trained:
                return []
            
            # Verificar si el usuario existe
            try:
                user_encoded = self.user_encoder.transform([user_id])[0]
            except ValueError:
                return []
            
            # Obtener embeddings de usuarios
            n_items = len(self.item_encoder.classes_)
            user_embeddings = []
            
            for i in range(len(self.user_encoder.classes_)):
                user_vector = np.zeros((1, n_items))
                if hasattr(self, 'rating_matrix'):
                    user_vector[0] = self.rating_matrix[i]
                user_transformed = self.model.transform(user_vector)
                user_embeddings.append(user_transformed[0])
            
            user_embeddings = np.array(user_embeddings)
            
            # Calcular similitudes con umbral optimizado
            target_embedding = user_embeddings[user_encoded]
            similarities = cosine_similarity([target_embedding], user_embeddings)[0]
            
            # Filtrar por umbral de similitud y obtener usuarios más similares
            similar_mask = similarities > self.similarity_threshold
            similar_indices = np.where(similar_mask)[0]
            
            # Ordenar por similitud y excluir el mismo usuario
            similar_users_with_scores = [
                (self.user_encoder.classes_[idx], similarities[idx]) 
                for idx in similar_indices 
                if idx != user_encoded
            ]
            similar_users_with_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Limitar al número solicitado
            similar_users = [user_id for user_id, _ in similar_users_with_scores[:n_similar]]
            
            return similar_users
            
        except Exception as e:
            logger.error(f"Error obteniendo usuarios similares: {e}")
            return []
    
    def initialize_default(self):
        """Inicializar modelo con configuración por defecto"""
        logger.info("Inicializando modelo colaborativo con configuración por defecto")
        self.is_trained = False
        # Configuración básica para funcionamiento sin datos
        self.user_features = {}
        self.item_features = {}
    
    def is_healthy(self) -> bool:
        """Verificar salud del modelo"""
        try:
            # Verificar que el modelo esté inicializado correctamente
            return self.model is not None or not self.is_trained  # Acepta modelo no entrenado
        except Exception as e:
            logger.error(f"Error verificando salud del modelo colaborativo: {e}")
            return False
    
    def optimize_hyperparameters(self, training_data: Dict[str, Any], 
                                validation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimizar hiperparámetros usando validación cruzada
        """
        try:
            logger.info("Optimizando hiperparámetros del modelo...")
            
            # Rangos de hiperparámetros a probar
            n_components_range = [20, 30, 50, 70, 100]
            n_iter_range = [5, 10, 15, 20]
            similarity_threshold_range = [0.5, 0.6, 0.7, 0.8, 0.9]
            
            best_score = -1
            best_params = {}
            results = []
            
            # Probar diferentes combinaciones
            for n_components in n_components_range:
                for n_iter in n_iter_range:
                    for similarity_threshold in similarity_threshold_range:
                        # Configurar hiperparámetros temporales
                        original_n_components = self.n_components
                        original_n_iter = self.n_iter
                        original_similarity = self.similarity_threshold
                        
                        self.n_components = n_components
                        self.n_iter = n_iter
                        self.similarity_threshold = similarity_threshold
                        
                        # Entrenar con configuración actual
                        train_result = self.train(training_data)
                        
                        if train_result["status"] == "success":
                            # Validar con datos de validación
                            validation_score = self._validate_model(validation_data)
                            
                            results.append({
                                "n_components": n_components,
                                "n_iter": n_iter,
                                "similarity_threshold": similarity_threshold,
                                "validation_score": validation_score,
                                "train_score": train_result.get("train_score", 0)
                            })
                            
                            if validation_score > best_score:
                                best_score = validation_score
                                best_params = {
                                    "n_components": n_components,
                                    "n_iter": n_iter,
                                    "similarity_threshold": similarity_threshold
                                }
                        
                        # Restaurar valores originales
                        self.n_components = original_n_components
                        self.n_iter = original_n_iter
                        self.similarity_threshold = original_similarity
            
            # Aplicar mejores hiperparámetros
            if best_params:
                self.n_components = best_params["n_components"]
                self.n_iter = best_params["n_iter"]
                self.similarity_threshold = best_params["similarity_threshold"]
                
                # Reentrenar con mejores parámetros
                final_train_result = self.train(training_data)
                
                logger.info(f"Hiperparámetros optimizados: {best_params}")
                logger.info(f"Mejor score de validación: {best_score:.4f}")
            
            return {
                "status": "success",
                "best_params": best_params,
                "best_score": best_score,
                "all_results": results,
                "n_combinations_tested": len(results)
            }
            
        except Exception as e:
            logger.error(f"Error optimizando hiperparámetros: {e}")
            return {"status": "error", "message": str(e)}
    
    def _validate_model(self, validation_data: Dict[str, Any]) -> float:
        """
        Validar el modelo con datos de validación
        """
        try:
            ratings = validation_data.get('ratings', [])
            if not ratings:
                return 0.0
            
            predictions = []
            actual_ratings = []
            
            for rating in ratings:
                user_id = rating['user_id']
                item_id = rating['item_id']
                actual_rating = rating['rating']
                
                # Predecir rating
                predicted_rating = self.predict_rating(user_id, item_id)
                
                predictions.append(predicted_rating)
                actual_ratings.append(actual_rating)
            
            # Calcular RMSE (Root Mean Square Error)
            if predictions and actual_ratings:
                rmse = np.sqrt(np.mean((np.array(predictions) - np.array(actual_ratings)) ** 2))
                # Convertir RMSE a score (menor RMSE = mejor score)
                validation_score = max(0.0, 1.0 - rmse)
                return validation_score
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error validando modelo: {e}")
            return 0.0
    
    def get_info(self) -> Dict[str, Any]:
        """Obtener información del modelo"""
        return {
            "type": "collaborative_filtering",
            "is_trained": self.is_trained,
            "n_users": len(self.user_encoder.classes_) if hasattr(self.user_encoder, 'classes_') else 0,
            "n_items": len(self.item_encoder.classes_) if hasattr(self.item_encoder, 'classes_') else 0,
            "algorithm": "SVD",
            "status": "healthy" if self.is_healthy() else "unhealthy",
            "hyperparameters": {
                "n_components": self.n_components,
                "n_iter": self.n_iter,
                "similarity_threshold": self.similarity_threshold
            }
        }


class ContentBasedModel:
    """
    Modelo basado en contenido para recomendaciones
    Utiliza características de usuarios e items para calcular similitud
    """
    
    def __init__(self, rating_weight: float = 0.3, specialty_weight: float = 0.25,
                 experience_weight: float = 0.2, review_weight: float = 0.15,
                 style_weight: float = 0.1, similarity_threshold: float = 0.6):
        self.user_profiles = {}
        self.item_profiles = {}
        self.feature_weights = {}
        self.is_trained = False
        self.scaler = StandardScaler()
        self.rating_weight = rating_weight
        self.specialty_weight = specialty_weight
        self.experience_weight = experience_weight
        self.review_weight = review_weight
        self.style_weight = style_weight
        self.similarity_threshold = similarity_threshold
        
    def train(self, training_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Entrenar el modelo basado en contenido
        """
        try:
            logger.info("Entrenando modelo basado en contenido...")
            
            user_profiles = training_data.get('user_profiles', [])
            item_profiles = training_data.get('item_profiles', [])
            
            if not user_profiles and not item_profiles:
                logger.warning("No hay perfiles de usuarios o items para entrenar")
                return {"status": "no_data", "message": "No hay suficientes perfiles de entrenamiento"}
            
            # Procesar perfiles de usuarios
            if user_profiles:
                self.user_profiles = self._process_user_profiles(user_profiles)
                # Debug: Verificar dimensionalidad de perfiles de usuario
                if self.user_profiles:
                    sample_user_id = list(self.user_profiles.keys())[0]
                    sample_user_vector = self.user_profiles[sample_user_id]
                    logger.info(f"Sample user vector dimension: {sample_user_vector.shape[0]}")
            
            # Procesar perfiles de items
            if item_profiles:
                self.item_profiles = self._process_item_profiles(item_profiles)
                # Debug: Verificar dimensionalidad de perfiles de item
                if self.item_profiles:
                    sample_item_id = list(self.item_profiles.keys())[0]
                    sample_item_vector = self.item_profiles[sample_item_id]
                    logger.info(f"Sample item vector dimension: {sample_item_vector.shape[0]}")
            
            # Calcular pesos de características
            self._calculate_feature_weights()
            
            self.is_trained = True
            
            logger.info("Modelo basado en contenido entrenado exitosamente")
            
            return {
                "status": "success",
                "n_user_profiles": len(self.user_profiles),
                "n_item_profiles": len(self.item_profiles),
                "n_features": len(self.feature_weights),
                "algorithm": "content_based"
            }
            
        except Exception as e:
            logger.error(f"Error entrenando modelo basado en contenido: {e}")
            return {"status": "error", "message": str(e)}
    
    def _process_user_profiles(self, user_profiles: List[UserProfile]) -> Dict[str, np.ndarray]:
        """Procesar perfiles de usuarios a vectores numéricos"""
        processed_profiles = {}
        
        try:
            for profile in user_profiles:
                # Debug: Log profile attributes
                logger.debug(f"Processing user profile: {profile.user_id}")
                logger.debug(f"Profile attributes: {dir(profile)}")
                logger.debug(f"Has name attribute: {hasattr(profile, 'name')}")
                if hasattr(profile, 'name'):
                    logger.debug(f"Name value: {profile.name}")
                
                # Crear vector de características con dimensionalidad fija de 28 para coincidir con items
                features = []
                
                # Preferencias de estilo (one-hot encoding) - 15 features para coincidir con specialties
                style_features = self._encode_preferences(profile.style_preferences, max_features=15)
                features.extend(style_features)
                
                # Sensibilidad de precio - 1 feature
                features.append(profile.price_sensitivity)
                
                # Preferencias de tiempo (one-hot encoding) - 3 features
                time_features = self._encode_time_preferences(profile.time_preferences)
                features.extend(time_features)
                
                # Historial de servicios (frecuencia) - 1 feature
                service_freq = len(profile.service_history) / 100.0  # Normalizar
                features.append(min(service_freq, 1.0))
                
                # Rating placeholder - 1 feature (usuarios no tienen rating, usar valor neutro)
                features.append(0.5)
                
                # Número de reseñas placeholder - 1 feature (usuarios no tienen reseñas, usar valor bajo)
                features.append(0.1)
                
                # Experiencia placeholder - 1 feature (usuarios no tienen experiencia como barberos)
                features.append(0.0)
                
                # Etiquetas de estilo adicional - 5 features para completar los 28
                additional_style_features = self._encode_preferences(profile.style_preferences, max_features=5)
                features.extend(additional_style_features)
                
                # Verificar dimensionalidad
                if len(features) != 28:
                    logger.warning(f"User vector dimension mismatch: expected 28, got {len(features)}")
                    # Ajustar dimensionalidad si es necesario
                    if len(features) < 28:
                        features.extend([0.0] * (28 - len(features)))
                    else:
                        features = features[:28]
                
                processed_profiles[profile.user_id] = np.array(features)
            
            return processed_profiles
            
        except Exception as e:
            logger.error(f"Error procesando perfiles de usuarios: {e}")
            logger.error(f"Exception details: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {}
    
    def _process_item_profiles(self, item_profiles: List[BarberProfile]) -> Dict[str, np.ndarray]:
        """Procesar perfiles de items (barberos) a vectores numéricos"""
        processed_profiles = {}
        
        try:
            for profile in item_profiles:
                # Crear vector de características
                features = []
                
                # Especialidades (one-hot encoding)
                specialty_features = self._encode_preferences(profile.specialties, max_features=15)
                features.extend(specialty_features)
                
                # Rating
                features.append(profile.rating / 5.0)  # Normalizar
                
                # Número de reseñas (log scale)
                review_score = np.log1p(profile.review_count) / 10.0  # Normalizar
                features.append(min(review_score, 1.0))
                
                # Experiencia (años)
                exp_score = (profile.experience_years or 0) / 20.0  # Normalizar
                features.append(min(exp_score, 1.0))
                
                # Etiquetas de estilo
                style_features = self._encode_preferences(profile.style_tags, max_features=10)
                features.extend(style_features)
                
                processed_profiles[profile.barber_id] = np.array(features)
            
            return processed_profiles
            
        except Exception as e:
            logger.error(f"Error procesando perfiles de items: {e}")
            return {}
    
    def _encode_preferences(self, preferences: List[str], max_features: int) -> List[float]:
        """Codificar lista de preferencias a vector binario"""
        if not preferences:
            return [0.0] * max_features
        
        # Crear vector binario
        feature_vector = [0.0] * max_features
        
        # Usar hash para asignar preferencias a índices
        for i, pref in enumerate(preferences[:max_features]):
            # Hash simple para distribuir preferencias
            hash_val = hash(pref) % max_features
            feature_vector[hash_val] = 1.0
        
        return feature_vector
    
    def _encode_time_preferences(self, time_preferences: List[str]) -> List[float]:
        """Codificar preferencias de tiempo"""
        time_slots = ["morning", "afternoon", "evening"]
        return [1.0 if slot in time_preferences else 0.0 for slot in time_slots]
    
    def _calculate_feature_weights(self):
        """Calcular pesos de características basados en hiperparámetros"""
        self.feature_weights = {
            "rating": self.rating_weight,
            "specialties": self.specialty_weight,
            "experience": self.experience_weight,
            "reviews": self.review_weight,
            "style": self.style_weight
        }
    
    def calculate_similarity(self, user_profile: UserProfile, item_profile: BarberProfile) -> float:
        """
        Calcular similitud entre perfil de usuario y perfil de item
        """
        try:
            if not self.is_trained:
                return self._default_similarity(user_profile, item_profile)
            
            # Obtener vectores de características
            user_vector = self.user_profiles.get(user_profile.user_id)
            item_vector = self.item_profiles.get(item_profile.barber_id)
            
            if user_vector is None or item_vector is None:
                # Usar similitud basada en atributos directos
                return self._attribute_based_similarity(user_profile, item_profile)
            
            # Debug: Verificar dimensionalidad
            logger.debug(f"User vector shape: {user_vector.shape}")
            logger.debug(f"Item vector shape: {item_vector.shape}")
            
            if user_vector.shape[0] != item_vector.shape[0]:
                logger.error(f"Dimension mismatch: user={user_vector.shape[0]}, item={item_vector.shape[0]}")
                return self._attribute_based_similarity(user_profile, item_profile)
            
            # Calcular similitud coseno con umbral
            similarity = cosine_similarity([user_vector], [item_vector])[0][0]
            
            # Aplicar umbral de similitud
            if similarity < self.similarity_threshold:
                return 0.0
            
            # Normalizar a rango 0-1
            return max(0.0, min(1.0, (similarity + 1) / 2.0))
            
        except Exception as e:
            logger.error(f"Error calculando similitud: {e}")
            return 0.5
    
    def calculate_reverse_similarity(self, barber_profile: BarberProfile, client_profile: UserProfile) -> float:
        """
        Calcular similitud inversa (barbero busca clientes)
        """
        try:
            # Similar al método normal pero con perspectiva invertida
            return self.calculate_similarity(client_profile, barber_profile)
            
        except Exception as e:
            logger.error(f"Error calculando similitud inversa: {e}")
            return 0.5
    
    def _default_similarity(self, user_profile: UserProfile, item_profile: BarberProfile) -> float:
        """Similitud por defecto cuando el modelo no está entrenado"""
        try:
            score = 0.5  # Base neutra
            
            # Ajustes basados en atributos directos
            if user_profile.style_preferences and item_profile.specialties:
                common_specialties = set(user_profile.style_preferences) & set(item_profile.specialties)
                if common_specialties:
                    score += 0.2 * len(common_specialties) / max(len(user_profile.style_preferences), 1)
            
            # Ajustar por rating
            if item_profile.rating:
                score += 0.1 * (item_profile.rating - 3.0) / 2.0
            
            return max(0.0, min(1.0, score))
            
        except Exception as e:
            logger.error(f"Error en similitud por defecto: {e}")
            return 0.5
    
    def _attribute_based_similarity(self, user_profile: UserProfile, item_profile: BarberProfile) -> float:
        """Calcular similitud basada en atributos directos"""
        try:
            score = 0.5  # Base neutra
            
            # Coincidencia de especialidades
            if user_profile.style_preferences and item_profile.specialties:
                user_prefs = set(user_profile.style_preferences)
                item_specs = set(item_profile.specialties)
                
                if user_prefs & item_specs:
                    overlap = len(user_prefs & item_specs)
                    total = len(user_prefs | item_specs)
                    jaccard_similarity = overlap / total if total > 0 else 0
                    score += 0.3 * jaccard_similarity
            
            # Preferencias de precio
            if hasattr(user_profile, 'price_sensitivity') and item_profile.price_range:
                user_budget = user_profile.price_sensitivity * 100
                item_avg_price = (item_profile.price_range.get('min', 0) + item_profile.price_range.get('max', 100)) / 2
                
                # Mayor similitud si el precio está dentro del presupuesto
                if item_avg_price <= user_budget:
                    score += 0.2
                else:
                    score -= 0.1
            
            # Rating como factor
            if item_profile.rating:
                rating_factor = (item_profile.rating - 2.5) / 2.5  # Normalizar rating
                score += 0.1 * rating_factor
            
            return max(0.0, min(1.0, score))
            
        except Exception as e:
            logger.error(f"Error en similitud basada en atributos: {e}")
            return 0.5
    
    def initialize_default(self):
        """Inicializar con configuración por defecto"""
        logger.info("Inicializando modelo basado en contenido con configuración por defecto")
        self.is_trained = False
        self.feature_weights = {
            "rating": 0.3,
            "specialties": 0.25,
            "experience": 0.2,
            "reviews": 0.15,
            "style": 0.1
        }
    
    def is_healthy(self) -> bool:
        """Verificar salud del modelo"""
        try:
            return True  # Este modelo es robusto incluso sin entrenamiento
        except Exception as e:
            logger.error(f"Error verificando salud del modelo de contenido: {e}")
            return False
    
    def optimize_hyperparameters(self, training_data: Dict[str, Any],
                                validation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimizar hiperparámetros del modelo basado en contenido
        """
        try:
            logger.info("Optimizando hiperparámetros del modelo basado en contenido...")
            
            # Rangos de hiperparámetros a probar
            weight_ranges = {
                "rating_weight": [0.2, 0.3, 0.4],
                "specialty_weight": [0.2, 0.25, 0.3],
                "experience_weight": [0.15, 0.2, 0.25],
                "review_weight": [0.1, 0.15, 0.2],
                "style_weight": [0.05, 0.1, 0.15],
                "similarity_threshold": [0.5, 0.6, 0.7, 0.8]
            }
            
            best_score = -1
            best_params = {}
            results = []
            
            # Probar diferentes combinaciones (muestra reducida para eficiencia)
            for rating_w in weight_ranges["rating_weight"]:
                for specialty_w in weight_ranges["specialty_weight"]:
                    for exp_w in weight_ranges["experience_weight"]:
                        for review_w in weight_ranges["review_weight"]:
                            for style_w in weight_ranges["style_weight"]:
                                for threshold in weight_ranges["similarity_threshold"]:
                                    # Configurar hiperparámetros temporales
                                    original_params = {
                                        "rating_weight": self.rating_weight,
                                        "specialty_weight": self.specialty_weight,
                                        "experience_weight": self.experience_weight,
                                        "review_weight": self.review_weight,
                                        "style_weight": self.style_weight,
                                        "similarity_threshold": self.similarity_threshold
                                    }
                                    
                                    # Aplicar nuevos pesos
                                    self.rating_weight = rating_w
                                    self.specialty_weight = specialty_w
                                    self.experience_weight = exp_w
                                    self.review_weight = review_w
                                    self.style_weight = style_w
                                    self.similarity_threshold = threshold
                                    
                                    # Entrenar con configuración actual
                                    train_result = self.train(training_data)
                                    
                                    if train_result["status"] == "success":
                                        # Validar con datos de validación
                                        validation_score = self._validate_content_model(validation_data)
                                        
                                        results.append({
                                            "rating_weight": rating_w,
                                            "specialty_weight": specialty_w,
                                            "experience_weight": exp_w,
                                            "review_weight": review_w,
                                            "style_weight": style_w,
                                            "similarity_threshold": threshold,
                                            "validation_score": validation_score
                                        })
                                        
                                        if validation_score > best_score:
                                            best_score = validation_score
                                            best_params = {
                                                "rating_weight": rating_w,
                                                "specialty_weight": specialty_w,
                                                "experience_weight": exp_w,
                                                "review_weight": review_w,
                                                "style_weight": style_w,
                                                "similarity_threshold": threshold
                                            }
                                    
                                    # Restaurar valores originales
                                    for param, value in original_params.items():
                                        setattr(self, param, value)
            
            # Aplicar mejores hiperparámetros
            if best_params:
                for param, value in best_params.items():
                    setattr(self, param, value)
                
                # Reentrenar con mejores parámetros
                final_train_result = self.train(training_data)
                
                logger.info(f"Hiperparámetros optimizados: {best_params}")
                logger.info(f"Mejor score de validación: {best_score:.4f}")
            
            return {
                "status": "success",
                "best_params": best_params,
                "best_score": best_score,
                "all_results": results[:10],  # Limitar resultados para no sobrecargar
                "n_combinations_tested": len(results)
            }
            
        except Exception as e:
            logger.error(f"Error optimizando hiperparámetros de contenido: {e}")
            return {"status": "error", "message": str(e)}
    
    def _validate_content_model(self, validation_data: Dict[str, Any]) -> float:
        """
        Validar el modelo basado en contenido
        """
        try:
            user_item_pairs = validation_data.get('user_item_pairs', [])
            if not user_item_pairs:
                return 0.0
            
            similarities = []
            
            for pair in user_item_pairs:
                user_profile = pair.get('user_profile')
                item_profile = pair.get('item_profile')
                expected_similarity = pair.get('expected_similarity', 0.5)
                
                if user_profile and item_profile:
                    calculated_similarity = self.calculate_similarity(user_profile, item_profile)
                    similarities.append({
                        "calculated": calculated_similarity,
                        "expected": expected_similarity
                    })
            
            # Calcular score de validación basado en diferencias
            if similarities:
                total_error = sum(abs(s["calculated"] - s["expected"]) for s in similarities)
                avg_error = total_error / len(similarities)
                validation_score = max(0.0, 1.0 - avg_error)
                return validation_score
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error validando modelo de contenido: {e}")
            return 0.0
    
    def get_info(self) -> Dict[str, Any]:
        """Obtener información del modelo"""
        return {
            "type": "content_based",
            "is_trained": self.is_trained,
            "n_user_profiles": len(self.user_profiles),
            "n_item_profiles": len(self.item_profiles),
            "algorithm": "cosine_similarity",
            "status": "healthy" if self.is_healthy() else "unhealthy",
            "hyperparameters": {
                "rating_weight": self.rating_weight,
                "specialty_weight": self.specialty_weight,
                "experience_weight": self.experience_weight,
                "review_weight": self.review_weight,
                "style_weight": self.style_weight,
                "similarity_threshold": self.similarity_threshold
            }
        }