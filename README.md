# P2P simple file sharing website
# How to run
1. install Nodejs
2. install MongoDB
3. apply correct MongoDB setting
4. cd ptp-file-sharing-pj
5. npm install
6. npm start

# MongoDB setting
1. create database "file-sharing"
2. create collection "user"
3. add data with sample format
{
  "_id": {
    "$oid": "654a55e4a5405a4e42428942"
  },
  "email": "email@email.email",
  "name": "Name",
  "password": "",
  "files": [
    "file 0",
    "file 1"
  ],
  "status": false
}
4. connect database at "mongodb://127.0.0.1:27017"