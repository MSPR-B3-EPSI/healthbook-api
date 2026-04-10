### Setup projet

- changer dans package.json le nom de votre application
- adapter le nom de la db dans le .env
- npm install
- lancer le docker-compose up --build

## A savoir

- Si vous voulez ajouter des fichiers il faut les renseigner dans les fichiers appriorié de modules/
- Pour avoir des nouveaux modèles de données, les ajouté a schema.prisma puis faire une migration en remplaçant les @ par ce qui correspond à votre appli : `docker exec -it @nomDeVotreContainer npx prisma migrate dev --name @nomDeLaMigration`
