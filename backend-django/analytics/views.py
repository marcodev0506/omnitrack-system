from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection
from geopy.distance import geodesic
import datetime
from .ml_engine import train_eta_model, predict_delay

@api_view(['GET'])
def DriverAnalyticsView(request, user_id):
    # --- 1. INICIALIZACIÓN (Evita el NameError) ---
    velocidad = 0
    estado = "Calculando..."
    alerta = "Sincronizando..."
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
        prediccion_segundos = predict_delay(modelo, hora_actual)

        # --- 4. RESPUESTA FINAL ---
        return Response({
            "driver_id": user_id,
            "speed_kph": round(velocidad, 2), # Ahora siempre existe
            "status": estado,
            "total_choferes_analizados": user_count,
            "ia_prediction": {
                "tiempo_estimado_tramo": f"{prediccion_segundos} seg",
                "confianza": "Alta" if len(rows) > 10 else "Baja"
            },
            "geo_alert": alerta,
            "recomendacion": "IA detecta tráfico denso" if str(prediccion_segundos).replace('.','').isdigit() and float(prediccion_segundos) > 60 else "Ruta fluida"
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)