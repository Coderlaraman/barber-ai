#!/usr/bin/env python3
"""
Script de prueba para el AI Recommender Service
"""

import requests
import json
import time
from typing import Dict, Any

# Configuración base
BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}

def test_health_check():
    """Probar el endpoint de health check"""
    print("🩺 Probando health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check: {data['status']}")
            print(f"📊 Modelos ML: {data['models_loaded']}")
            print(f"💾 Redis: {data['redis_connected']}")
            return True
        else:
            print(f"❌ Error en health check: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando al servicio: {e}")
        return False

def test_barber_recommendations():
    """Probar recomendaciones de barberos"""
    print("\n💈 Probando recomendaciones de barberos...")
    
    payload = {
        "client_id": "client_001",
        "location": {"lat": 40.7128, "lng": -74.0060},
        "max_distance_km": 10,
        "service_types": ["HAIRCUT", "BEARD_TRIM"],
        "preferred_date": "2024-12-15",
        "time_preference": "morning",
        "limit": 5
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/recommend/barbers",
            headers=HEADERS,
            data=json.dumps(payload)
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Recomendaciones obtenidas: {data['total_count']}")
            print(f"🤖 Algoritmo usado: {data['algorithm_used']}")
            print(f"📊 Confianza: {data['confidence_score']}")
            print(f"⏱️  Tiempo de ejecución: {data['execution_time_ms']}ms")
            
            if data['recommendations']:
                print("\n📋 Top recomendaciones:")
                for i, rec in enumerate(data['recommendations'][:3], 1):
                    print(f"  {i}. {rec['name']} (Score: {rec['score']:.2f})")
                    print(f"     📍 Distancia: {rec['distance_km']:.1f}km")
                    print(f"     ⭐ Rating: {rec['rating']}")
                    print(f"     💰 Precio: ${rec['price_range']['min']}-${rec['price_range']['max']}")
                    print(f"     🔍 Razón: {rec['recommendation_reason']}")
            
            return True
        else:
            print(f"❌ Error en recomendaciones: {response.status_code}")
            print(f"📄 Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en recomendaciones: {e}")
        return False

def test_client_recommendations():
    """Probar recomendaciones de clientes"""
    print("\n👤 Probando recomendaciones de clientes...")
    
    payload = {
        "barber_id": "barber_001",
        "location": {"lat": 40.7128, "lng": -74.0060},
        "max_distance_km": 15,
        "service_types": ["HAIRCUT", "BEARD_TRIM"],
        "date": "2024-12-15",
        "limit": 5
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/recommend/clients",
            headers=HEADERS,
            data=json.dumps(payload)
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Clientes recomendados: {data['total_count']}")
            print(f"🤖 Algoritmo usado: {data['algorithm_used']}")
            print(f"📊 Confianza: {data['confidence_score']}")
            
            if data['recommendations']:
                print("\n📋 Top clientes recomendados:")
                for i, rec in enumerate(data['recommendations'][:3], 1):
                    print(f"  {i}. {rec['name']} (Score: {rec['score']:.2f})")
                    print(f"     📍 Distancia: {rec['distance_km']:.1f}km")
                    print(f"     💰 Presupuesto: ${rec['budget_range']['min']}-${rec['budget_range']['max']}")
            
            return True
        else:
            print(f"❌ Error en recomendaciones de clientes: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error en recomendaciones de clientes: {e}")
        return False

def test_model_training():
    """Probar reentrenamiento de modelos"""
    print("\n🧠 Probando reentrenamiento de modelos...")
    
    payload = {
        "triggered_by": "manual_test",
        "reason": "Testing del servicio"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/models/train",
            headers=HEADERS,
            data=json.dumps(payload)
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Modelos reentrenados exitosamente")
            print(f"📊 Modelo colaborativo: {data['collaborative_model_status']}")
            print(f"📊 Modelo contenido: {data['content_model_status']}")
            print(f"⏱️  Tiempo total: {data['training_time_seconds']}s")
            return True
        else:
            print(f"⚠️  Reentrenamiento falló: {response.status_code}")
            print(f"📄 Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en reentrenamiento: {e}")
        return False

def test_model_status():
    """Probar estado de modelos"""
    print("\n📊 Probando estado de modelos...")
    
    try:
        response = requests.get(f"{BASE_URL}/models/status")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Estado de modelos obtenido")
            print(f"🤖 Modelo colaborativo: {data['collaborative_filtering']['status']}")
            print(f"📄 Modelo contenido: {data['content_based']['status']}")
            print(f"📅 Último entrenamiento: {data['last_training_date']}")
            return True
        else:
            print(f"❌ Error obteniendo estado: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error obteniendo estado: {e}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    print("🚀 Iniciando pruebas del AI Recommender Service")
    print(f"📡 Endpoint: {BASE_URL}")
    print("=" * 50)
    
    # Esperar un momento para que el servicio esté listo
    print("⏳ Esperando que el servicio esté disponible...")
    time.sleep(2)
    
    tests = [
        test_health_check,
        test_barber_recommendations,
        test_client_recommendations,
        test_model_status,
        test_model_training
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Error ejecutando test: {e}")
        time.sleep(1)  # Pequeña pausa entre pruebas
    
    print("\n" + "=" * 50)
    print(f"📊 Resumen de pruebas: {passed}/{total} pasadas")
    
    if passed == total:
        print("🎉 ¡Todas las pruebas pasaron!")
    else:
        print(f"⚠️  {total - passed} pruebas fallaron")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)