import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import datetime

class ETAPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100)
        self._train_dummy_model()

    def _train_dummy_model(self):
        """Entrena el modelo con datos simulados de tráfico en Caracas"""
        # Datos: [Distancia (km), Hora (0-23)] -> Tiempo (minutos)
        # Ejemplo: 5km a las 8am (hora pico) tarda más que 5km a las 11pm
        data = {
            'distancia': [2, 5, 10, 2, 5, 10, 5, 5],
            'hora': [8, 8, 8, 23, 23, 23, 13, 17],
            'tiempo': [25, 50, 90, 10, 15, 30, 25, 45] # Tiempo real observado
        }
        df = pd.DataFrame(data)
        X = df[['distancia', 'hora']]
        y = df['tiempo']
        self.model.fit(X, y)

    def predict_arrival(self, distancia_km):
        hora_actual = datetime.datetime.now().hour
        # Predicción basada en el modelo entrenado
        estimacion = self.model.predict([[distancia_km, hora_actual]])
        return round(estimacion[0], 2)

# Instancia única para no re-entrenar en cada petición
predictor = ETAPredictor()