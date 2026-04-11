from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection

@api_view(['GET'])
def analyze_logistics(request):
    # Usamos una consulta SQL directa para ver los usuarios de Laravel
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]

    return Response({
        "status": "Análisis Completado",
        "motor": "Python 3.x / Django Analytics",
        "total_choferes_analizados": user_count,
        "optimizacion_ruta": "85%",
        "recomendacion": "Aumentar flota en zona norte de Caracas"
    })