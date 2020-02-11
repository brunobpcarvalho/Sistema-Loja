const Sequelize = require('sequelize');
var db = require("../config/conexao");

const Modelo = db.define('modelos', {
  descricao: {
    type: Sequelize.STRING
  },
  ativo: {
    type: Sequelize.STRING
  }
})
Modelo.sync()
module.exports = Modelo;
