# network-visualizer
This is the client side of network visualizer for neo4J.

# INSTALLATION

1. Clone the repository and checkout to development-client branch
2. Make sure you have neo4J installed or data hosted on sandbox and it should be running
3. Go to root of the project and type 'npm install'
4. Open databse_config/config.json and update user credentials if needed (if no password is needed leave the password blank)
5. type 'node server.js' in the root of the project.
6. Go to client/ and type npm install to install packages
7. Once done, type 'ng serve' and wait for the build
8. Your app will be active on port 4200

# Installation and Setup of Neo4j Database

1. Download the Neo4j Database Server (version -> Neo4j Community Edition 3.3.9) from the link below: 
* https://neo4j.com/download-center/#community
2. Unzip or Untar the folder.
3. Download the data of the Neo4j from the link below :
* https://drive.google.com/file/d/1VXKeDb5lpH5-x1tIcLWHbnkfdn3KucO0/view?usp=sharing
4. Unzip the folder and paste it in location "neo4j-community-3.3.9/data/databases".
5. Now open a terminal in the folder "neo4j-community-3.3.9" and run "./bin/neo4j start" (with prefix "sudo" for Linux users) to run the neo4j server.
6. Open the Neo4j server in the browser at "http://localhost:7474".

# new requirement startd with property rendering