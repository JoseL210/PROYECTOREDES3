class ErrorLogEntry {
    /**
     * Constructor para inicializar el objeto ErrorLogEntry
     * @param {string} id - Identificador único del error
     * @param {string} errorMessage - Mensaje descriptivo del error
     */
    constructor(id, errorMessage) {
        this.id = id;
        this.errorMessage = errorMessage;
    }

    // Getter para el ID
    getId() {
        return this.id;
    }

    // Setter para el ID
    setId(id) {
        this.id = id;
    }

    // Getter para el mensaje de error
    getErrorMessage() {
        return this.errorMessage;
    }

    // Setter para el mensaje de error
    setErrorMessage(errorMessage) {
        this.errorMessage = errorMessage;
    }

    // Método toString para imprimir una representación del objeto
    toString() {
        return `ErrorLogEntry { id='${this.id}', errorMessage='${this.errorMessage}' }`;
    }
}

module.exports = ErrorLogEntry;
