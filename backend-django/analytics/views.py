from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from geopy.distance import geodesic
from datetime import datetime
from .ml_engine import predictor

class DriverAnalyticsView(APIView):
    def get(self, request, user_id):
        # ... (Mantén tu lógica de velocidad de antes) ...

        # Supongamos que el Almacén Central está en Chacao
        ALMACEN_COORDS = (10.4912, -66.8524)
        ultima_pos = (rows[0][0], rows[0][1])
        
        distancia_al_destino = geodesic(ultima_pos, ALMACEN_COORDS).kilometers
        
        # 🧠 AQUÍ ENTRA LA IA
        minutos_estimados = predictor.predict_arrival(distancia_al_destino)

        return Response({
            "driver_id": user_id,
            "speed_kph": round(velocidad, 2),
            "status": estado,
            "eta_minutes": minutos_estimados, # <--- La predicción de la IA
            "distancia_destino_km": round(distancia_al_destino, 2)
        })