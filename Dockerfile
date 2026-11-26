FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# Seuls les fichiers servis aux élèves entrent dans l'image (ni tests, ni documents)
COPY index.html manutention.html tortue.css /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/
COPY fonts/ /usr/share/nginx/html/fonts/
COPY media/ /usr/share/nginx/html/media/
