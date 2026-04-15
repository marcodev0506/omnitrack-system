from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from geopy.distance import geodesic
from datetime import datetime

class DriverAnalyticsView(APIView):
    def get(self, request, user_id):
        with connection.cursor() as cursor:
            # Traemos las últimas 2 ubicaciones para comparar
            cursor.execute(
                "SELECT lat, lng, created_at FROM locations WHERE user_id = %s ORDER BY created_at DESC LIMIT 2",
                [user_id]
            )
            rows = cursor.fetchall()

        if len(rows) < 2:
            return Response({"status": "Calculando...", "speed": 0})

        # Punto A (Anterior) y Punto B (Actual)
        pos_b, pos_a = rows[0], rows[1]
        
        # Calcular distancia en km usando geopy
        distancia = geodesic((pos_a[0], pos_a[1]), (pos_b[0], pos_b[1])).kilometers
        
        # Calcular tiempo en horas
        tiempo_delta = (pos_b[2] - pos_a[2]).total_seconds() / 3600
        
        # Velocidad = Distancia / Tiempo (km/h)
        velocidad = distancia / tiempo_delta if tiempo_delta > 0 else 0

        # Lógica de "Cerebro": Determinar estado
        estado = "En movimiento" if velocidad > 5 else "Detenido o tráfico pesado"
        if velocidad > 80:
            estado = "⚠️ Exceso de velocidad"

        return Response({
            "driver_id": user_id,
            "speed_kph": round(velocidad, 2),
            "status": estado,
            "last_update": pos_b[2]
        })