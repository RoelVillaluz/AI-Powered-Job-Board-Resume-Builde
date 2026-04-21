FROM node:20

RUN apt-get update && apt-get install -y python3 python3-pip python3-venv build-essential

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/src/python_scripts/requirements.txt ./requirements.txt

RUN python3 -m venv /venv
RUN /venv/bin/pip install --upgrade pip
RUN /venv/bin/pip install -r requirements.txt

COPY backend/ .

ENV PATH="/venv/bin:$PATH"

EXPOSE 5000

CMD ["npm", "run", "start"]