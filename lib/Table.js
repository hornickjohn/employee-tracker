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
            this.fieldText.push('FOREIGN KEY (' + name + ') REFERENCES ' + this.name + '(id)');
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

    async getData(db) {
        let rv = "error";
        await db.promise().query('SELECT * FROM ' + this.name).then(results => {
            try {
                rv = results[0];
            } catch(error) {
                throw error;
            }
        });
        return rv;
    }

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
}

module.exports = Table;