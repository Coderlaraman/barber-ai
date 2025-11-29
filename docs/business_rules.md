# Reglas de Negocio – BarberIA

## Objetivo
- Definir las reglas que rigen el comportamiento del sistema y los límites operativos, alineadas a la arquitectura de microservicios.

## Roles y Identidades
- Roles: `Cliente`, `Barbero`, `Admin`.
- Un barbero puede operar en múltiples ubicaciones con tarifas, servicios y horarios propios.
- El cliente controla permisos de acceso a su historial.

## Agenda y Reservas
- Bloques de disponibilidad con duración mínima de 15m.
- No se crean bloqueos ni citas que colisionen con bloqueos previos o citas confirmadas.
- Reprogramación por cliente ≥2h antes; cancelación con penalizaciones: >12h 0%, 2–12h 20%, <2h 50%.
- Estados de cita: `solicitada`, `confirmada`, `cancelada`, `completada`.
- Eventos: `booking.created`, `booking.confirmed`, `booking.cancelled`, `booking.rescheduled`, `schedule.blocked`, `schedule.released`, `schedule.updated`.

## Pagos
- Estados: `pendiente`, `abonado`, `pagado`, `devuelto`.
- Anticipos opcionales; liquidación presencial en fase inicial.
- Reembolsos sujetos a penalizaciones definidas.

## Portafolio
- Consentimiento del cliente para uso de imágenes y datos.
- Metadata mínima por ítem: técnica, estilo, productos.
- Moderación y derecho a desindexación.

## Reseñas
- Rating 1–5 y reseña textual opcional; una por cita completada.
- Edición hasta 48h; mecanismos anti-spam y reportes.

## Historial del Cliente
- Fotos, notas técnicas, preferencias; acceso por consentimiento explícito.
- Portabilidad y exportación estandarizada.

## Servicios Premium
- Lista configurable por barbero; precio y duración por servicio.
- Promociones y paquetes; gestionar incompatibilidades.

## Buscador
- Filtros: ubicación, disponibilidad, precio, calificación, especializaciones.
- Relevancia: cercanía, rating, recencia, actividad.
- Cache en Redis con invalidación por eventos.

## IA de Recomendación
- Entrada: rasgos faciales, historial, preferencias; salida: sugerencias.
- Confirmación del cliente requerida; registro de inputs/outputs para trazabilidad.

## Ranking
- Métrica compuesta: rating ponderado, volumen, retención, servicios premium.
- Actualización por eventos y proceso batch diario; rankings por ubicación/ciudad/país/global.

## Notificaciones
- Canales: push, email, SMS (opt-in) con preferencias y “no molestar”.
- Entrega idempotente y registrada.

## Privacidad y Cumplimiento
- Consentimiento para biométricos/imágenes.
- Retención por jurisdicción; borrado/anonimización y desindexación a solicitud.

## Gobernanza
- Moderación: advertencias, suspensiones, ban.
- Auditoría de acciones críticas y trazabilidad para disputas.