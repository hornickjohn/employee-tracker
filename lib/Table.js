class Table {
    constructor(name,ref,refvar,cascade) {
        this.name = name;
        this.refname = ref;
        this.fieldText = [];
        this.fieldText.push('id INT NOT NULL AUTO_INCREMENT PRIMARY KEY');
        if(ref && refvar) {
            this.addField(refvar,'INT',false);
            this.designateFK(ref,refvar,cascade);
        }
    }

    //returns a Table object with this name for performing sql operations on
    static GetRef(name) {
        const rv = new Table(name);
        rv.fieldText = null;
        return rv;
    }

    //creates a new field to att to the structure of this table
    //if selfkey, this field will be a recursive key on this table
    addField(name,type,notnullable,selfkey) {
        let str = name + ' ' + type;
        if(notnullable) {
            str += ' NOT NULL';
        }
        this.fieldText.push(str);
        if(selfkey) {
            this.fieldText.push('FOREIGN KEY (' + name + ') REFERENCES ' + this.name + '(id) ON DELETE SET NULL');
        }
    }

    //sets refvar as a foreign key to ref table
    designateFK(ref,refvar,cascade) {
        let str = 'FOREIGN KEY (' + refvar + ') REFERENCES ' + ref + '(id) ON DELETE ';
        if(cascade) {
            str += 'CASCADE';
        } else {
            str += 'SET NULL';
        }
        this.fieldText.push(str);
    }

    //generates table in db based on added fields
    create(db, overwrite) {
        if(overwrite) {
            db.query('DROP TABLE IF EXISTS ' + this.name,(err,results) => {
                if(err) {
                    throw err;
                }
            });
        }
        db.query(`CREATE TABLE IF NOT EXISTS ${this.name} (` + this.fieldText.join(',') + ')', (err,results) => {
            if(err) {
                throw err;
            }
        });
    }

    //returns data from table - if all params passed, WHERE field=value
    async getData(db,field,value) {
        let rv = "error";
        let extraquery = '';
        if(field && value) {
            extraquery = ' WHERE ' + field + ' = ' + value;
        }
        await db.promise().query('SELECT * FROM ' + this.name + extraquery).then(results => {
            try {
                rv = results[0];
            } catch(error) {
                throw error;
            }
        });
        return rv;
    }

    //get a data readout including fields from other tables
    //kinda hard-coded for now for this application
    async getJoinedData(db,field,value) {
        let qstr = '';
        let rv = 'error';
        let extraquery = '';
        if(field && value) {
            extraquery = ' WHERE ' + field + ' = ' + value;
        }
        if(this.name === 'employees') {
            qstr = 'SELECT employees.id, first_name, last_name, roles.title, departments.name AS department, roles.salary, manager_id AS manager FROM employees JOIN roles ON employees.role_id = roles.id JOIN departments ON roles.department_id = departments.id'
        } else if(this.name === 'roles') {
            qstr = 'SELECT roles.id, roles.title, departments.name AS department, roles.salary FROM roles JOIN departments ON roles.department_id = departments.id'
        } else {
            qstr = 'SELECT id, name AS department FROM departments';
        }
        qstr += extraquery;
        await db.promise().query(qstr).then(results => {
            try {
                rv = results[0];
            } catch(error) {
                throw error;
            }
        });
        return rv;
    }

    //takes array of key/value pairs and adds them as data to table
    async addData(data,db) {
        let fields = data.map(kvpair => kvpair.field);
        let values = data.map(kvpair => kvpair.value);
        let str = 'INSERT INTO ' + this.name + '(' + fields.join(',') + ') VALUES (' + values.join(',') + ')'; 
        await db.promise().query(str).then(results => {
            try {} catch (err) {
                throw err;
            }
        });
    }

    //updates given field of given id with new value
    async updateData(id,field,value,db) {
        await db.promise().query('UPDATE ' + this.name + ' SET ' + field + ' = ' + value + ' WHERE id = ' + id)
        .then(results => {
            try {} catch (err) {
                throw err;
            }
        });
    }

    //removes a row of data
    async deleteData(db,id) {
        await db.promise().query('DELETE FROM ' + this.name + ' WHERE id = ' + id)
        .then(results => {
            try {} catch (err) {
                throw err;
            }
        });
    }
}

module.exports = Table;