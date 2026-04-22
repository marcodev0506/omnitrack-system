from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection
from geopy.distance import geodesic
import datetime

@api_view(['GET'])
def DriverAnalyticsView(request, user_id): # <--- CAMBIAMOS EL NOMBRE AQUÍ
    rows = []
    user_count = 0

    try:
        with connection.cursor() as cursor:
            # Consulta de conteo general
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]

            # Consulta de ubicación
            cursor.execute(
                "SELECT lat, lng, created_at FROM locations WHERE user_id = %s ORDER BY created_at DESC LIMIT 2",
                [user_id]
            )
            rows = cursor.fetchall()

        if not rows or len(rows) < 2:
            return Response({
                "status": "Calculando...",
                "total_choferes_analizados": user_count,
                "speed_kph": 0,
                "geo_alert": "Sincronizando GPS..."
            })

        pos_recent, pos_old = rows[0], rows[1]
        dist = geodesic((pos_old[0], pos_old[1]), (pos_recent[0], pos_recent[1])).kilometers
        diff_time = (pos_recent[2] - pos_old[2]).total_seconds() / 3600
        velocidad = dist / diff_time if diff_time > 0 else 0

        return Response({
            "driver_id": user_id,
            "status": "En movimiento" if velocidad > 5 else "Detenido",
            "total_choferes_analizados": user_count,
            "speed_kph": round(velocidad, 2),
            "geo_alert": "✅ En zona" if velocidad < 80 else "⚠️ Exceso de velocidad",
            "last_update": pos_recent[2]
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)