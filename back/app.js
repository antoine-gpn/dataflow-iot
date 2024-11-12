const express = require("express");
const cors = require("cors");
const app = express();
const cron = require("node-cron");
const port = "8001";
app.use(cors());
app.use(express.json());
const { MongoClient } = require("mongodb");
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
  "Steps walked": { min: 50, max: 500, operator: "sum", unit: "" },
  "Calories burned": { min: 50, max: 200, operator: "sum", unit: "cal" },
  "Heart-rate average": { min: 60, max: 170, operator: "avg", unit: "bpm" },
  "Remaining battery": { min: 30, max: 100, operator: "avg", unit: "%" },
  "Consumption history": { min: 3, max: 10, operator: "sum", unit: "Watt" },
  "Estimated costs": { min: 0, max: 3, operator: "sum", unit: "" },
  "Distance traveled": { min: 50, max: 500, operator: "sum", unit: "m" },
  "Floors climbed": { min: 0, max: 10, operator: "sum", unit: "" },
  "Air Quality Index": { min: 50, max: 100, operator: "avg", unit: "" },
  "Fine particle levels": { min: 50, max: 100, operator: "avg", unit: "" },
  "Oxygen Concentration": { min: 70, max: 100, operator: "avg", unit: "%" },
  "Average temperature": { min: 15, max: 35, operator: "avg", unit: "°C" },
  "Average humidity": { min: 10, max: 100, operator: "avg", unit: "" },
  "Sunshine exposure": { min: 1, max: 60, operator: "sum", unit: "min" },
  "Lightning intensity": { min: 10, max: 30, operator: "avg", unit: "lux" },
  "Time on": { min: 1, max: 60, operator: "sum", unit: "min" },
  "Body Weight": { min: 100, max: 200, operator: "avg", unit: "kg" },
  "Body Mass Index": { min: 100, max: 200, operator: "avg", unit: "" },
  "Muscle rate": { min: 70, max: 100, operator: "avg", unit: "%" },
  "Body Water rate": { min: 70, max: 100, operator: "avg", unit: "%" },
  "Bodyfat rate": { min: 10, max: 25, operator: "avg", unit: "%" },
  "Body Age": { min: 20, max: 30, operator: "avg", unit: "years" },
};

const fields = {
  SmartWatch: [
    "Steps walked",
    "Calories burned",
    "Heart-rate average",
    "Remaining battery",
    "Distance traveled",
    "Floors climbed",
  ],
  "Smart Balance": [
    "Body Weight",
    "Body Mass Index",
    "Muscle rate",
    "Body Water rate",
    "Bodyfat rate",
    "Body Age",
  ],
  "Smart Lightbulb": [
    "Consumption history",
    "Estimated costs",
    "Remaining battery",
    "Lightning intensity",
    "Time on",
  ],
  "Temperature sensor": [
    "Average temperature",
    "Average humidity",
    "Sunshine exposure",
    "Consumption history",
    "Estimated costs",
    "Remaining battery",
  ],
  "Air quality sensor": [
    "Air Quality Index",
    "Fine particle levels",
    "Oxygen Concentration",
    "Consumption history",
    "Estimated costs",
    "Remaining battery",
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
  return finalRes;
}

async function main() {
  await client.connect();
  const db = client.db(dbName);

  cron.schedule("* * * * *", async () => {
    let now = new Date();
    now.setMinutes(0, 0, 0);
    const firstTimestampHour = now.getTime();

    //Récupération du dernier ID le plus élevé
    const nbDatas = await db.collection("devices-data").countDocuments();
    let highestId = nbDatas + 1;

    let objsToInsert = [];
    const datasCollection = db.collection("devices-data");
    const devicesCollection = db.collection("devices");
    const projectionDevice = { _id: 1, deviceType: 1 };
    const devices = await devicesCollection
      .find({}, { projectionDevice })
      .toArray();

    for (const device of devices) {
      const existingData = await datasCollection
        .find({
          device_id: device._id,
          date: firstTimestampHour,
        })
        .toArray();

      if (existingData.length === 0) {
        let obj = {
          _id: highestId,
          device_id: device._id,
          date: firstTimestampHour,
        };
        fields[device.deviceType].forEach((field) => {
          let min = fieldsOptions[field]["min"];
          let max = fieldsOptions[field]["max"];
          obj[field] = Math.floor(Math.random() * (max - min + 1)) + min;
        });
        objsToInsert.push(obj);
      }
    }

    if (objsToInsert.length === 0) {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      console.log(`Nothing to add : ${hours}h${minutes}`);
    } else {
      await db.collection("devices-data").insertMany(objsToInsert);
      console.log("Data added");
    }
  });

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
        const operation = fieldsOptions[field]["operator"];

        if (operation === "sum") {
          result[field] =
            items.reduce((acc, item) => acc + item[field], 0) +
            " " +
            fieldsOptions[field]["unit"];
        } else if (operation === "avg") {
          const sum = items.reduce((acc, item) => acc + item[field], 0);
          result[field] =
            Math.round(sum / items.length) + " " + fieldsOptions[field]["unit"];
        } else if (operation === "last") {
          result[field] = item + " " + fieldsOptions[field]["unit"];
        }
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

      const startDate = new Date("2024-11-01T00:00:00Z");
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
      const nbDatas = await db.collection("devices-data").countDocuments();
      let highestId = nbDatas + 1;

      //Récupération des timestamps déjà insérés
      const allStamps = await db.collection("devices-data").distinct("date");

      for (const timestamp of timestampsByHour) {
        let objsToInsert = [];

        if (!allStamps.includes(timestamp)) {
          for (const device of devices) {
            let obj = {
              _id: highestId,
              device_id: device._id,
              date: timestamp,
            };
            fields[device.deviceType].forEach((field) => {
              let min = fieldsOptions[field]["min"];
              let max = fieldsOptions[field]["max"];
              obj[field] = Math.floor(Math.random() * (max - min + 1)) + min;
            });
            objsToInsert.push(obj);
            highestId += 1;
          }
        }

        if (objsToInsert.length !== 0) {
          db.collection("devices-data").insertMany(objsToInsert);
        }
      }

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
