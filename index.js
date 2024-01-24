const { MongoClient } = require('mongodb');
const mongoose = require("mongoose");
const fs = require('fs');

const PORT = '3001';
const DATABASE = 'meteor';
const INSERTAR = true;

if (!INSERTAR) {
  return false;
}

const url = `mongodb://127.0.0.1:${PORT}`;
console.log('Connection to => ', url);

const client = new MongoClient(url);
const dbName = DATABASE;

async function main() {
  await client.connect();
  console.log('Connected successfully to server');

  const newData = JSON.parse(fs.readFileSync("Data.json", "utf8"));
  const data = generateData(newData);

  const db = client.db(dbName);
  const collectionTasks = db.collection('tasks');
  const collectionGembas = db.collection('gembas');
  const collectionReports = db.collection('reports');

  const insertResult = await collectionTasks.insertMany(data.tasks);
  const insertGembas = await collectionGembas.insertMany(data.audits);
  const insertReports = await collectionReports.insertMany(data.report);
  console.log('Inserted TASKS =>', insertResult);
  console.log('Inserted AUDITS =>', insertGembas);
  console.log('Inserted REPORTS =>', insertReports);

  return 'Done';
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());



function generateData(json) {
  const temp = json;

  let tasks = [];
  let audits = [];

  temp.subReports.map(sub => {
    sub.tasksReports.map(i => {
      var newId = new mongoose.mongo.ObjectId();
      // console.log(newId);
      tasks.push({_id: newId, name: i.name});
    });
  });

  const report = {
    score: json.score,
    iso: json.iso,
    locationsReport: json.subReports.map(report => {
      let temp = {
        score: report.score,
      }

      let tasksByReport = [];
      if (report.reason) {
        temp.reason = report.reason;
        temp.skiped = true;
      }

      report.tasksReports.map(task => {
        const tempTask = tasks.find(t =>t.name == task.name);

        let newTask = {
          task: tempTask._id,
          compilance: task.compliance,
          docs: task.documents??[],
        };

        return tasksByReport.push(newTask);
      });

      temp.tasksReports = tasksByReport;

      return temp;
    })
  }

  audits.push({
    name: json.gembaWalkName,
    description: json.gembaWalkDescription,
  });

  const toSend = {
    tasks: [...new Set(tasks)],
    audits,
    report,
  }
  // console.log('TO ', toSend)

  return toSend;
}
