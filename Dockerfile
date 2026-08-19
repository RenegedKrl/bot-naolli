FROM node:20-bullseye-slim

# Instala dependências do sistema necessárias para bots de música (Python para yt-dlp, ffmpeg, etc)
RUN apt-get update && \
    apt-get install -y python3 ffmpeg build-essential && \
    rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração do npm e instala as dependências
COPY package*.json ./
RUN npm install

# Copia o resto dos arquivos do bot para o container
COPY . .

# O Hugging Face Spaces exige que a aplicação web rode na porta 7860
ENV PORT=7860
EXPOSE 7860

# Comando para iniciar o bot
CMD ["npm", "start"]
