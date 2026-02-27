FROM python:3.11-slim
WORKDIR /app

# 의존성 먼저 설치 (캐시 활용)
COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Python 코어 모듈 복사 (api가 참조하는 상위 모듈)
COPY config.py ./config.py
COPY parser/ ./parser/
COPY renderer/ ./renderer/
COPY utils/ ./utils/

# API 소스 복사
COPY api/ ./api/

WORKDIR /app/api
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
