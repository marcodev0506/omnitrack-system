from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection
from geopy.distance import geodesic
import datetime
from .ml_engine import train_eta_model, predict_delay, get_traffic_pattern

@api_view(['GET'])
def DriverAnalyticsView(request, user_id):
    # --- 1. INICIALIZACIÓN ---
    velocidad = 0
    estado = "Sin datos"
    alerta = "Esperando ubicación..."
    user_count = 0
    rows = []

    try:
        with connection.cursor() as cursor:
            # Conteo de usuarios
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]

            # Últimas ubicaciones
            cursor.execute(
                "SELECT lat, lng, created_at FROM locations WHERE user_id = %s ORDER BY created_at DESC LIMIT 2",
                [user_id]
            )
            rows = cursor.fetchall()

        # --- 2. CÁLCULO DE VELOCIDAD (Si hay datos suficientes) ---
        if rows and len(rows) >= 2:
            pos_recent, pos_old = rows[0], rows[1]

            dist = geodesic((pos_old[0], pos_old[1]), (pos_recent[0], pos_recent[1])).kilometers
            diff_time = (pos_recent[2] - pos_old[2]).total_seconds() / 3600

            if diff_time > 0:
                velocidad = dist / diff_time

            estado = "En movimiento" if velocidad > 5 else "Detenido"
            alerta = "✅ En zona" if velocidad < 80 else "⚠️ Exceso de velocidad"

        # --- 3. INTELIGENCIA ARTIFICIAL (ML Engine) ---
        hora_actual = datetime.datetime.now().hour
        modelo = train_eta_model(user_id)

        # Obtener última velocidad del usuario (de Redis o calcular)
        # Para MVP, usamos la velocidad calculada arriba
        current_speed = velocidad if velocidad > 0 else 30  # Fallback si no hay datos

        prediccion_segundos = predict_delay(modelo, hora_actual, current_speed)
        patron_trafico = get_traffic_pattern(hora_actual)

        # Convertir segundos a formato legible
        if prediccion_segundos < 60:
            tiempo_str = f"{round(prediccion_segundos)} segundos"
        elif prediccion_segundos < 3600:
            minutos = round(prediccion_segundos / 60)
            tiempo_str = f"{minutos} minutos"
        else:
            horas = round(prediccion_segundos / 3600, 1)
            tiempo_str = f"{horas} horas"

        # Calcular confianza basada en cantidad de datos
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM locations WHERE user_id = %s", [user_id])
                data_points = cursor.fetchone()[0]
                confianza = "Alta" if data_points > 50 else "Media" if data_points > 20 else "Baja"
        except:
            confianza = "Baja"

        # --- 4. RESPUESTA FINAL ---
        return Response({
            "driver_id": user_id,
            "speed_kph": round(velocidad, 2),
            "status": estado,
            "total_choferes_analizados": user_count,
            "ia_prediction": {
                "tiempo_estimado_tramo": tiempo_str,
                "patron_trafico": patron_trafico,
                "confianza": confianza
            },
            "geo_alert": alerta,
            "recomendacion": get_recommendation(patron_trafico, velocidad, prediccion_segundos)
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)

def get_recommendation(patron_trafico, velocidad, tiempo_estimado):
    """Genera recomendación basada en patrón de tráfico y velocidad"""
    if velocidad < 5:
        return "Conductor detenido. Verificar estado."
    elif "Tráfico alto" in patron_trafico:
        if velocidad > 80:
            return "¡Peligro! Tráfico alto + exceso de velocidad. Reducir velocidad."
        return "Tráfico denso. Mantener distancia de seguridad."
    elif "Tráfico moderado" in patron_trafico:
        return "Tráfico medio. Flujo normal permitido."
    elif tiempo_estimado > 600:  # Más de 10 minutos
        return "Tramo largo anticipado. Considerar ruta alternativa."
    else:
        return "Condiciones favorables para ruta."