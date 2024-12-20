class DataEntry {
    /**
     * Constructor para inicializar el objeto DataEntry
     * @param {string} id - Identificador único
     * @param {string} content - Contenido del DataEntry
     */
    constructor(id = '', content = '') {
        this.id = id;
        this.content = content;
    }

    // Getter para el ID
    getId() {
        return this.id;
    }

    // Setter para el ID
    setId(id) {
        this.id = id;
    }

    // Getter para el contenido
    getContent() {
        return this.content;
    }

    // Setter para el contenido
    setContent(content) {
        this.content = content;
    }

    // Método toString para imprimir una representación del objeto
    toString() {
        return `DataEntry { id='${this.id}', content='${this.content}' }`;
    }
}

module.exports = DataEntry;
