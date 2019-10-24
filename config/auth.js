const localStrategy = require("passport-local").Strategy;
const db = require('../config/conexao')
const bcrypt = require("bcryptjs");

const Usuario = require("../models/Usuario");

module.exports = function(passport){
  passport.use(new localStrategy({usernameField: 'usuario', passwordField: 'senha' }, (usuario, senha, done) => {
    Usuario.findOne({ where: {usuario: usuario}}).then((usuario) => {
      if(!usuario){
        return done(null, false, {message: "Esta conta não existe"});
      }

      bcrypt.compare(senha, usuario.senha, (erro, igual) => {
        if(igual){
          return done(null, usuario);
        }else{
          return done(null, false, {message: "Senha incorreta"});
        }
      });
    });
  }));

  passport.serializeUser(function(usuario, done) {
    done(null, usuario);
  });

  passport.deserializeUser(function(objeto, done) {
    done(null, objeto);
  });
}
