class AuditLogEntry {
    constructor(id, action) {
        this.id = id;
        this.action = action;
    }

    getId() {
        return this.id;
    }

    getAction() {
        return this.action;
    }

    setId(id) {
        this.id = id;
    }

    setAction(action) {
        this.action = action;
    }

    toString() {
        return `AuditLogEntry { id='${this.id}', action='${this.action}' }`;
    }
}

module.exports = AuditLogEntry;
