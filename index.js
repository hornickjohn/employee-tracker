const mysql = require('mysql2');
const inquirer = require('inquirer');
const Table = require('./lib/Table');

// Connect to database
const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'testdb'
    },
    console.log(`Connected to the testdb database.`)
  );

function DisplayTitleCard() {
    console.log('Welcome to the Employee Tracker!');
}

function MainMenu() {
    inquirer.prompt([
        { name:"choice", message:"What would you like to do?", choices:[
            {name:'View All Employees', value:0},
            {name:'Add Employee', value:1},
            {name:'Update Employee Role', value:2},
            {name:'View All Roles', value:3},
            {name:'Add Role', value:4},
            {name:'View All Departments',value:5},
            {name:'Add Department',value:6},
            {name:'Quit', value:7}
        ] }
    ])
    .then((answers) => {
        switch(answers.choice) {
            case 0:
                break;
            case 1:
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                break;
            case 5:
                break;
            case 6:
                break;
            case 7:
                break;
            default:
                throw new Error('No Answer Provided In Menu');
        }
    })
    .catch((err) => {
        if (err) {
        throw err;
        }
    });
}

function ViewTable() {

}

// DisplayTitleCard();
// MainMenu();

let depts = new Table("departments");
depts.addField('name','VARCHAR(30)',true);
depts.create(db);
let roles = new Table('roles','departments','department_id',true);
roles.addField('title','VARCHAR(30)',true);
roles.addField('salary','DECIMAL',true);
roles.create(db);
let empls = new Table('employees','roles','role_id',true);
empls.addField('first_name','VARCHAR(30)',true);
empls.addField('last_name','VARCHAR(30)',true);
empls.addField('manager_id','INT',false);
empls.create(db);