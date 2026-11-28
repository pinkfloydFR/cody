FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# Seuls les fichiers servis aux élèves entrent dans l'image (ni tests, ni documents)
COPY index.html manutention.html vue.html tortue.css /usr/share/nginx/html/
# version.txt : écrit par deploy/deployer.sh (absent d'une construction à la main : pas de mise à jour auto)
COPY version.tx[t] /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/
COPY fonts/ /usr/share/nginx/html/fonts/
COPY media/ /usr/share/nginx/html/media/
