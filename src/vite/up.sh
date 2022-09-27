docker stop c4front
docker build -t c4front_vite . && docker run --name c4front --rm -v $PWD/../../src:/app/src -p 127.0.0.10:3000:3000 -p 127.0.0.10:80:3000 c4front_vite
