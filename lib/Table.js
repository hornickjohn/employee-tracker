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

    addField(name,type,notnullable) {
        let str = name + ' ' + type;
        if(notnullable) {
            str += ' NOT NULL';
        }
        this.fieldText.push(str);
    }

    designateFK(ref,refvar,cascade) {
        let str = 'FOREIGN KEY (' + refvar + ') REFERENCES ' + ref + '(id) ON DELETE ';
        if(cascade) {
            str += 'CASCADE';
        } else {
            str += 'SET NULL';
        }
        this.fieldText.push(str);
    }

    create(db) {
        db.query(`CREATE TABLE ${this.name} (` + this.fieldText.join(',') + ')', (err,results) => {
            if(err) {
                throw err;
            }
        });
    }
}

module.exports = Table;