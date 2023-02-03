const mysql = require('mysql2');
const inquirer = require('inquirer');
const Table = require('./lib/Table.js');
const cTable = require('console.table');

let departments;
let roles;
let employees;

// Connect to database
const db = mysql.createConnection(
    {
      host: 'localhost',
      // MySQL username,
      user: 'root',
      // MySQL password
      password: 'password',
      database: 'employee_db'
    },
    console.log(`Connected to the employee_db database.`)
  );

const RequireAnswer = ans => ans.trim() !== '';

function CreateTables() {
    const departments = new Table('departments');
    const roles = new Table('roles','departments','department_id',true);
    const employees = new Table('employees','roles','role_id',true);

    departments.addField('name','VARCHAR(30)',true);

    roles.addField('title','VARCHAR(30)',true);
    roles.addField('salary','DECIMAL',true);

    employees.addField('first_name','VARCHAR(30)',true);
    employees.addField('last_name','VARCHAR(30)',true);
    employees.addField('manager_id','INT',false,true);

    departments.create(db,false);
    roles.create(db,false);
    employees.create(db,false);
}

function DisplayTitleCard() {
    console.log('\n\n' +
        '--------------------------------\n' + 
        'Welcome to the Employee Tracker!\n' + 
        '--------------------------------\n');
}

function MainMenu() {
    inquirer.prompt([
        { name:"choice", message:"What would you like to do?", type:'list', choices:[
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
    .then(async answers => {
        switch(answers.choice) {
            case 0:
                await ViewTable(employees);
                MainMenu();
                break;
            case 1:
                AddData(employees);
                break;
            case 2:
                break;
            case 3:
                await ViewTable(roles);
                MainMenu();
                break;
            case 4:
                AddData(roles);
                break;
            case 5:
                await ViewTable(departments);
                MainMenu();
                break;
            case 6:
                AddData(departments);
                break;
            case 7:
                console.log('Goodbye!');
                process.exit();
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

async function AddData(table) {
    //departments.addData([{field:'name',value:'"anothertestval"'}],db);
    let questions = [];
    switch(table.name) {
        case 'departments':
            questions.push({ name:'name', message:'Enter name of department:', validate:RequireAnswer });
            break;
        case 'roles':
            const depts = await departments.getData();
            questions.push({ name:'title', message:'Enter title of role:', validate:RequireAnswer });
            questions.push({ name:'salary', message:'Enter salary for role:', validate:RequireAnswer });
            const dptoptions = [];
            depts.forEach(dept => {
                dptoptions.push({
                    name:dept.name,
                    value:dept.id
                });
            });
            questions.push({ name:'department_id', message:'Role is in which department?', type:'list', choices:dptoptions });
            break;
        case 'employees':
            const rls = await departments.getData();
            questions.push({ name:'first_name', message:'First name of employee:', validate:RequireAnswer });
            questions.push({ name:'last_name', message:'Last name of employee:', validate:RequireAnswer });
            const rloptions = [];
            rls.forEach(rl => {
                rloptions.push({
                    name:rl.name,
                    value:rl.id
                });
            });
            questions.push({ name:'role_id', message:'Employee is in which role?', type:'list', choices:rloptions });
            break;
        default:
            throw new Error('Invalid Table Passed to AddData()');
    }
}

async function ViewTable(table) {
    const dat = await table.getData(db);
    if(dat.length) {
        console.log('\n');
        console.table(dat);
    } else {
        console.log('\nTable is empty - add some data!\n');
    }
}

//generates tables in DB if they do not exist
CreateTables();

//get references to each table
departments = Table.GetRef('departments');
roles = Table.GetRef('roles');
employees = Table.GetRef('employees');

//start program
DisplayTitleCard();
MainMenu();
