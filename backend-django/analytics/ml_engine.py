import pandas as pd
from sklearn.linear_model import LinearRegression
from django.db import connection
import numpy as np

def train_eta_model(user_id):
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

    # 2. FEATURE ENGINEERING (Convertimos coordenadas en datos útiles)
    # Calculamos la hora del día (0-23) como factor de tráfico
    df['hour'] = pd.to_datetime(df['created_at']).dt.hour
    
    # Calculamos el tiempo transcurrido entre puntos (en segundos)
    df['time_diff'] = pd.to_datetime(df['created_at']).diff().dt.total_seconds().fillna(0)
    
    # 3. ENTRENAMIENTO
    # X = [Hora del día], y = [Segundos por tramo]
    # (En un sistema real usaríamos también distancia, pero esto es para probar el patrón)
    X = df[['hour']].values
    y = df['time_diff'].values

    model = LinearRegression()
    model.fit(X, y)
    
    return model

def predict_delay(model, current_hour):
    if model is None: return "Datos insuficientes"
    
    # Predecimos cuánto suele tardar un tramo a esta hora
    prediction = model.predict([[current_hour]])
    return round(float(prediction[0]), 2)