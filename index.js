const mysql = require('mysql2');
const inquirer = require('inquirer');
const Table = require('./lib/Table.js');


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
                ViewTable('employees');
                MainMenu();
                break;
            case 1:
                break;
            case 2:
                break;
            case 3:
                ViewTable('roles');
                MainMenu();
                break;
            case 4:
                break;
            case 5:
                ViewTable('departments');
                MainMenu();
                break;
            case 6:
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

function ViewTable() {
    
}

// DisplayTitleCard();
// MainMenu();