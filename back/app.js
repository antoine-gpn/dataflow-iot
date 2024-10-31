//Utilisation d'Express pour l'API
const express = require("express");
const cors = require("cors");
const app = express();
const port = "8001";
app.use(cors());
app.use(express.json());
const { MongoClient } = require("mongodb");
const {
  log,
} = require("@angular-devkit/build-angular/src/builders/ssr-dev-server");
const uri =
  "mongodb+srv://admin:3dxRMp0Oj2fslcN6q8Je@mongodb-3f4688a4-o2d827d68.database.cloud.ovh.net/admin?replicaSet=replicaset&tls=true";
const client = new MongoClient(uri);
const dbName = "dataflow-iot";

//Gestion des erreurs
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }
}

app.get("/", (req, res) => {
  res.json("Root");
});

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

//[minInterval, maxInterval, typeOfCalcul]
const fieldsOptions = {
  "Number of steps": [100, 200, "sum"],
  "Calories burned": [50, 100, "sum"],
  "Heart-rate": [60, 150, "avg"],
  "Remaning battery": [10, 90, "avg"],
  "Consumption history": [30, 50, "sum"],
  "Estimated costs": [1, 5, "sum"],
};

const fields = {
  SmartWatch: [
    "Number of steps",
    "Calories burned",
    "Heart-rate",
    "Remaning battery",
  ],
  "Security camera": [
    "Consumption history",
    "Estimated costs",
    "Remaning battery",
  ],
  "Smart Lightbulb": [
    "Consumption history",
    "Estimated costs",
    "Remaning battery",
  ],
  "Temperature sensor": [
    "Consumption history",
    "Estimated costs",
    "Remaning battery",
  ],
  "Air quality sensor": [
    "Consumption history",
    "Estimated costs",
    "Remaning battery",
  ],
};

function getFirstTimestampOfWeek() {
  let now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  now.setDate(now.getDate() + daysToMonday);
  return now.setHours(0, 0, 0, 0);
}

function getFirstTimestampOfMonth() {
  const now = new Date();
  let firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  firstDayOfMonth.setHours(0, 0, 0, 0);
  return firstDayOfMonth.getTime();
}

function getStartDate(selectedTime) {
  switch (selectedTime) {
    case "today":
      return new Date().setHours(0, 0, 0, 0);
    case "week":
      return getFirstTimestampOfWeek();
    case "month":
      return getFirstTimestampOfMonth();
  }
}

function getDaysNumberOfMonth() {
  const dateActuelle = new Date();
  const mois = dateActuelle.getMonth();
  const annee = dateActuelle.getFullYear();
  const premierJourDuMoisSuivant = new Date(annee, mois + 1, 0);
  const nombreDeJours = premierJourDuMoisSuivant.getDate();
  return nombreDeJours;
}

function formatSpecificData(selectedTime, items, type) {
  let finalRes;
  switch (selectedTime) {
    case "today":
      finalRes = [];
      for (let hour = 0; hour <= 23; hour++) {
        finalRes.push({ Time: hour, Value: 0 });
      }
      items.forEach((item) => {
        let index = new Date(item.date).getHours();
        const hour = finalRes.find((item) => item.Time === index);
        hour["Value"] = item[type];
      });

      break;
    case "week":
      finalRes = [
        { Time: "Monday", Value: 0 },
        { Time: "Tuesday", Value: 0 },
        { Time: "Wednesday", Value: 0 },
        { Time: "Thursday", Value: 0 },
        { Time: "Friday", Value: 0 },
        { Time: "Saturday", Value: 0 },
        { Time: "Sunday", Value: 0 },
      ];
      items.forEach((item) => {
        let date = new Date(item.date).getDay();
        let index = days[date];
        const day = finalRes.find((item) => item.Time === index);
        if (day) {
          day["Value"] += item[type];
        }
      });

      break;
    case "month":
      const nombreDeJours = getDaysNumberOfMonth();
      finalRes = [];
      for (let jour = 1; jour <= nombreDeJours; jour++) {
        finalRes.push({ Time: jour, Value: 0 });
      }
      items.forEach((item) => {
        let index = new Date(item.date).getDate();
        const day = finalRes.find((item) => item.Time === index);
        if (day) {
          day["Value"] += item[type];
        }
      });

      break;
  }
  console.log(finalRes);
  return finalRes;
}

async function main() {
  await client.connect();
  const db = client.db(dbName);

  app.get("/getAllDevices", async (req, res) => {
    try {
      const collection = db.collection("devices");
      const items = await collection.find().toArray();

      res.json(items);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des données" });
    }
  });

  app.get("/getAllDatasByDeviceAndTime/:id/:time", async (req, res) => {
    try {
      const collection = db.collection("devices-data");
      const deviceId = parseInt(req.params.id);
      const selectedTime = req.params.time;
      const startDate = getStartDate(selectedTime);
      const device = await db
        .collection("devices")
        .find({ _id: deviceId })
        .toArray();
      const type = device[0]["deviceType"];
      let projection = {};
      let result = {};
      let fieldsArray = [];
      fields[type].forEach((field) => {
        projection[field] = 1;
        result[field] = 0;
        fieldsArray.push(field);
      });

      const items = await collection
        .find(
          {
            device_id: deviceId,
            date: { $gte: startDate },
          },
          {
            projection,
          }
        )
        .toArray();

      fieldsArray.forEach((field) => {
        result[field] = items.reduce((acc, item) => acc + item[field], 0);
      });

      res.json(result);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des données" });
    }
  });

  app.get(
    "/getSpecificDataByDeviceAndTime/:id/:type/:time",
    async (req, res) => {
      try {
        const collection = db.collection("devices-data");
        const deviceId = parseInt(req.params.id);
        const selectedTime = req.params.time;
        const type = req.params.type;
        const startDate = getStartDate(selectedTime);
        const projection = { [type]: 1, date: 1 };

        const items = await collection
          .find(
            {
              device_id: deviceId,
              date: { $gte: startDate },
            },
            {
              projection,
            }
          )
          .toArray();

        const finalRes = formatSpecificData(selectedTime, items, type);

        res.json(finalRes);
      } catch (error) {
        res
          .status(500)
          .json({ error: "Erreur lors de la récupération des données" });
      }
    }
  );

  app.get("/generateDatas", async (req, res) => {
    try {
      //Récupération des devices IOT
      const devices = await db.collection("devices").find().toArray();

      const startDate = new Date("2024-10-01T00:00:00Z");
      const endDate = new Date();

      // Tableau pour stocker les timestamps
      const timestampsByHour = [];

      // Remplir le tableau avec les timestamps par heure
      for (
        let currentDate = startDate;
        currentDate <= endDate;
        currentDate.setHours(currentDate.getHours() + 1)
      ) {
        timestampsByHour.push(currentDate.getTime());
      }

      //Récupération du dernier ID le plus élevé
      let highestId = await db
        .collection("devices-data")
        .aggregate([
          {
            $group: {
              _id: null,
              maxId: { $max: "$_id" },
            },
          },
        ])
        .toArray();
      highestId = highestId[0]["maxId"] + 1;

      devices.forEach((device) => {
        let objsToInsert = [];
        timestampsByHour.forEach((timestamp) => {
          let obj = { _id: highestId, device_id: device._id, date: timestamp };
          fields[device.deviceType].forEach((field) => {
            let min = fieldsOptions[field][0];
            let max = fieldsOptions[field][1];
            obj[field] = Math.floor(Math.random() * (max - min + 1)) + min;
          });
          objsToInsert.push(obj);
          highestId += 1;
        });

        db.collection("devices-data").insertMany(objsToInsert);
      });

      res.status(201).json(timestampsByHour);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des données" });
    }
  });
}

main();

module.exports = app;
