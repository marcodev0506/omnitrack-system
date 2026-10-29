import pandas as pd
from sklearn.linear_model import LinearRegression
from django.db import connection
import numpy as np
from geopy.distance import geodesic

def train_eta_model(user_id):
    """
    Entrena un modelo para predecir tiempo de viaje basado en:
    - Hora del día (patrones de tráfico)
    - Velocidad promedio del conductor
    - Día de la semana (opcional, no implementado en MVP)
    """
    # 1. Extraemos el historial real de la DB
    query = """
        SELECT lat, lng, created_at
        FROM locations
        WHERE user_id = %s
        ORDER BY created_at ASC
    """
    df = pd.read_sql(query, connection, params=[user_id])

    if len(df) < 10:
        return None # Necesitamos al menos 10 puntos para empezar a aprender

    # 2. FEATURE ENGINEERING
    # Calculamos la hora del día (0-23) como factor de tráfico
    df['hour'] = pd.to_datetime(df['created_at']).dt.hour

    # Calculamos distancia entre puntos consecutivos (en km)
    distances = []
    for i in range(1, len(df)):
        pos1 = (df.iloc[i-1]['lat'], df.iloc[i-1]['lng'])
        pos2 = (df.iloc[i]['lat'], df.iloc[i]['lng'])
        dist = geodesic(pos1, pos2).kilometers
        distances.append(dist)

    # Agregamos distancias (asumiendo distancias iguales para rellenar)
    df['distance'] = [0] + distances

    # Calculamos tiempo entre puntos (en segundos)
    df['time_diff'] = pd.to_datetime(df['created_at']).diff().dt.total_seconds().fillna(0)

    # Calculamos velocidad (km/h) para cada punto
    df['speed'] = (df['distance'] / (df['time_diff'] / 3600)).replace([np.inf, -np.inf], 0)

    # 3. ENTRENAMIENTO MEJORADO
    # Usamos hora y velocidad promedio del tramo para predecir tiempo
    # En MVP: Predecir tiempo basado en hora del día (patrones de tráfico)
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)  # Ciclo horario
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)

    # Filtrar solo tramos donde hay movimiento (time_diff > 0)
    df_movement = df[df['time_diff'] > 1].copy()

    if len(df_movement) < 5:
        return None

    # X = features (hora ciclica, velocidad), y = tiempo en segundos
    X = df_movement[['hour_sin', 'hour_cos', 'speed']].values
    y = df_movement['time_diff'].values

    model = LinearRegression()
    model.fit(X, y)

    return model

def predict_delay(model, current_hour, current_speed=0):
    """
    Predice tiempo estimado para un tramo basado en:
    - Hora actual (patrones de tráfico: hora pico vs fuera de hora pico)
    - Velocidad actual del conductor
    """
    if model is None:
        # Fallback: Estimación simple basada en velocidad
        if current_speed > 0:
            # Asumiendo tramo promedio de 1km a velocidad actual
            time_seconds = (1 / current_speed) * 3600
            return round(time_seconds, 2)
        return 300  # 5 minutos por defecto

    # Convertir hora a features cíclicas
    hour_sin = np.sin(2 * np.pi * current_hour / 24)
    hour_cos = np.cos(2 * np.pi * current_hour / 24)

    # Predecir tiempo
    prediction = model.predict([[hour_sin, hour_cos, current_speed]])
    time_seconds = float(prediction[0])

    # Asegurar que sea positivo y razonable
    time_seconds = max(30, min(time_seconds, 3600))  # Entre 30s y 1 hora

    return round(time_seconds, 2)

def get_traffic_pattern(current_hour):
    """
    Devuelve un patrón de tráfico basado en la hora
    """
    # Patrones típicos de tráfico en Venezuela
    if 6 <= current_hour < 9:
        return "Tráfico alto (hora pico mañana)"
    elif 12 <= current_hour < 14:
        return "Tráfico moderado (hora pico medio día)"
    elif 17 <= current_hour < 20:
        return "Tráfico alto (hora pico tarde)"
    elif 22 <= current_hour or current_hour < 6:
        return "Tráfico muy bajo (madrugada/noche)"
    else:
        return "Tráfico normal (horas valle)"
