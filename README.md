### Setup projet

- changer dans package.json le nom de votre application et modifier les noms des services dans le docker compose 
- adapter le nom de la db dans le .env
- npm install
- lancer le docker-compose up --build
- j'ai créé des repository, mais il est admis dans la communauté nest que c'est inutile et la logique / orm se fait dans les services directement

## A savoir

- Si vous voulez ajouter des fichiers il faut les renseigner dans les fichiers appriorié de modules/
- Pour avoir des nouveaux modèles de données, les ajouté a schema.prisma puis faire une migration en remplaçant les @ par ce qui correspond à votre appli : `docker exec -it @nomDeVotreContainer npx prisma migrate dev --name @nomDeLaMigration`
  (c'est très autonome, vous avez juste a modifier le schema.prisma et prisma s'occupe de générer la migration sql et la lance directement pour modifier la db)
