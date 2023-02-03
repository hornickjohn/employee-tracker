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

//Creates the tables in the database if they do not already exist
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

//Welcome message when app starts
function DisplayTitleCard() {
    console.log('\n\n' +
        '--------------------------------\n' + 
        'Welcome to the Employee Tracker!\n' + 
        '--------------------------------\n');
}

//Display menu with options for user to pick which functionality to use
function MainMenu() {
    inquirer.prompt([
        { name:"choice", message:"What would you like to do?", type:'list', choices:[
            {name:'View All Employees', value:0},
            {name:'Add Employee', value:1},
            {name:'Update Employee Role', value:2},
            {name:'Update Employee Manager', value:3},
            {name:'View All Roles', value:4},
            {name:'Add Role', value:5},
            {name:'View All Departments',value:6},
            {name:'Add Department',value:7},
            {name:'Quit', value:8}
        ] }
    ])
    .then(async answers => {
        switch(answers.choice) {
            case 0:
                //view employee table
                await ViewTable(employees);
                MainMenu();
                break;
            case 1:
                //send user to add an employee
                AddData(employees);
                break;
            case 2:
                //send user to update role of an employee
                UpdateData(employees,roles);
                break;
            case 3:
                //send user to update manager of an employee
                UpdateData(employees,employees);
                break;
            case 4:
                //view role table
                await ViewTable(roles);
                MainMenu();
                break;
            case 5:
                //send user to add a role
                AddData(roles);
                break;
            case 6:
                //view department table
                await ViewTable(departments);
                MainMenu();
                break;
            case 7:
                //send user to add a department
                AddData(departments);
                break;
            case 8:
                //say bye and exit
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

//Go through inquirer process with user to determine data for new entry based on which table they're entering
//Add the data and return to main menu
async function AddData(table) {
    //populate inquirer questions based on which table they're entering data
    let questions = [];
    switch(table.name) {
        case 'departments':
            questions.push({ name:'name', message:'Enter name of department:', validate:RequireAnswer });
            break;
        case 'roles':
            questions.push({ name:'title', message:'Enter title of role:', validate:RequireAnswer });
            questions.push({ name:'salary', message:'Enter salary for role:', validate:RequireAnswer });
            questions.push({ name:'department_id', message:'Role is in which department?', type:'list', choices:await GetInquirerOptionsFromTable(departments,'name') });
            break;
        case 'employees':
            questions.push({ name:'first_name', message:'First name of employee:', validate:RequireAnswer });
            questions.push({ name:'last_name', message:'Last name of employee:', validate:RequireAnswer });
            questions.push({ name:'role_id', message:'Employee is in which role?', type:'list', choices:await GetInquirerOptionsFromTable(roles,'title') });
            //set aside user choices for employee manager, then prepend "None" option which will return null
            let managerOptions = await GetInquirerOptionsFromTable(employees,['first_name','last_name']);
            managerOptions = [{name:'None',value:null}].concat(managerOptions);
            questions.push({ name:'manager_id', message:'Who is employee\'s manager?', type:'list', choices:managerOptions });
            break;
        default:
            throw new Error('Invalid Table Passed to AddData()');
    }

    //prompt user with above questions 
    inquirer.prompt([
        ...questions
    ])
    .then(async answers => {
        //add data based on which table we're entering
        switch(table.name) {
            case 'departments':
                await table.addData([
                    {field:'name',value:Stringify(answers.name)}
                ],db);
                break;
            case 'roles':
                await table.addData([
                    {field:'title',value:Stringify(answers.title)},
                    {field:'salary',value:answers.salary},
                    {field:'department_id',value:answers.department_id}
                ],db);
                break;
            case 'employees':
                dataToAdd = [
                    {field:'first_name',value:Stringify(answers.first_name)},
                    {field:'last_name',value:Stringify(answers.last_name)},
                    {field:'role_id',value:answers.role_id}
                ];
                //don't add anything for manager_id if it was left null
                if(answers.manager_id) {
                    dataToAdd.push({field:'manager_id',value:answers.manager_id});
                }
                await table.addData(dataToAdd,db);
                break;
            default:
                throw new Error('Invalid Table Passed to AddData()');
        }
        MainMenu();
    })
    .catch((err) => {
        if (err) {
            throw err;
        }
    });
}

//Go through inquirer process with user to determine what data is changing to what
//Update the data and return to main menu
async function UpdateData(table,reftable) {
    let questions = [];
    if(table.name === 'employees' && reftable.name === 'employees') {
        //we're updating employee manager
        questions.push({ name:'employee', message:'Which employee is being updated?', type:'list', choices:await GetInquirerOptionsFromTable(table,['first_name','last_name'])});
        let managerOptions = await GetInquirerOptionsFromTable(employees,['first_name','last_name']);
        managerOptions = [{name:'None',value:null}].concat(managerOptions);
        questions.push({ name:'manager', message:'Who is the new manager?', type:'list', choices:managerOptions });
    } else if(table.name === 'employees' && reftable.name === 'roles') {
        //we're updating employee role
        questions.push({ name:'employee', message:'Which employee is being updated?', type:'list', choices:await GetInquirerOptionsFromTable(table,['first_name','last_name'])});
        questions.push({ name:'role', message:'What is the new role?', type:'list', choices:await GetInquirerOptionsFromTable(reftable,'title') });
    } else if(table.name === 'roles' && reftable.name === 'departments') {
        //we're updating role's department
        questions.push({ name:'role', message:'Which role is being updated?', type:'list', choices:await GetInquirerOptionsFromTable(table,'title')});
        questions.push({ name:'department', message:'Role is moving to which department?', type:'list', choices:await GetInquirerOptionsFromTable(reftable,'name') });
    } else {
        console.log('Invalid Update Input');
        return;
    }

    //prompt user with above questions
    inquirer.prompt([
        ...questions
    ])
    .then(async answers => {
        //call on table to update data in correct cell based on input
        if(table.name === 'employees' && reftable.name === 'employees') {
            await table.updateData(answers.employee,'manager_id',answers.manager,db);
        } else if(table.name === 'employees' && reftable.name === 'roles') {
            await table.updateData(answers.employee,'role_id',answers.role,db);
        } else if(table.name === 'roles' && reftable.name === 'departments') {
            await table.updateData(answers.role,'department_id',answers.department,db);
        }
        MainMenu();
    })
    .catch((err) => {
        if (err) {
            throw err;
        }
    });
}

//Go through inquirer process with user to determine which subset of a table they want to view
//Display the data
async function ViewSubset(table,flag) {
    if(table.name === 'employees') {
        let questions = [];
        if(flag === 'manager') {
            questions.push({ name:'res', message:'Which manager\'s employees would you like to view?', type:'list', choices:GetInquirerOptionsFromTable(employees,['first_name','last_name']) });
        } else if(flag==='role') {
            questions.push({ name:'res', message:'Which role\'s staff would you like to view?', type:'list', choices:GetInquirerOptionsFromTable(roles,'title') });
        } else {
            return 'Invalid Flag Input';
        }
        inquirer.prompt([
            ...questions
        ])
        .then(async answers => {
            await ViewTable(table,flag + '_id',answers.res);
            MainMenu();
        })
        .catch((err) => {
            if (err) {
                throw err;
            }
        });
    } else {
        console.log('Subset functionality not included for that table currently.');
    }
}

//format a string with ' around it so that it can be used as a string elsewhere (such as DB queries)
function Stringify(inp) {
    return "'" + inp + "'";
}

//gets an array of inquirer-formatted choices
//displayed name will be the value in the table corresponding to the key given as identifier
//returned value will be the 'id' property of the table 
async function GetInquirerOptionsFromTable(table,identifier) {
    const dat = await table.getData(db);
    const options = [];
    if(typeof identifier === 'string') {
        identifier = [identifier];
    }
    dat.forEach(row => {
        let optionname = identifier.map(str => row[str]).join(' ');
        options.push({
            name:optionname,
            value:row.id
        });
    });
    return options;
}

//displays table formatted in console
async function ViewTable(table,field,value) {
    const dat = await table.getData(db,field,value);
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
