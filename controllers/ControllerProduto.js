var db = require("../config/conexao")
const Produto = require("../models/Produto")
const Modelo = require("../models/Modelo")
const Fabricante = require("../models/Fabricante")
const ItensVenda = require("../models/ItensVenda")
const ItensCompra = require("../models/ItensCompra")
const Empresa = require("../models/Empresa")

exports.listAll = (req, res) => {
	Produto.findAll({
		include: [
			{ model: Fabricante, as: 'fabricante' },
			{ model: Modelo, as: 'modelo' }
		]
	}).then((dadosProduto) => {
		Modelo.findAll({where: {ativo: 'Ativo'}}).then((dadosModelo) => {
			Fabricante.findAll({where: {ativo: 'Ativo'}}).then((dadosFabricante) => {
					const contextProduto = {
						produtos: dadosProduto.map(dado => {
							return {
								id: dado.id,
								descricao: dado.descricao,
								quantidade: dado.quantidade,
								genero: dado.genero,
								nomeFabricante: dado.fabricante.nome,
								descricaoModelo: dado.modelo.descricao,
								valorUnitario: dado.valorUnitario,
								valorCusto: dado.valorCusto,
								prazoReposicao: dado.prazoReposicao,
								ativo: dado.ativo,
							}
						})
					}
					const contextModelo = {
						modelos: dadosModelo.map(dado => {
							return {
								id: dado.id,
								descricao: dado.descricao,
								ativo: dado.ativo,
							}
						})
					}
					const contextFabricante = {
						fabricantes: dadosFabricante.map(dado => {
							return {
								id: dado.id,
								nome: dado.nome,
								ativo: dado.ativo,
							}
						})
					}

					res.render("produtos/list-produtos", {
						produtos: contextProduto.produtos,
						modelos: contextModelo.modelos,
						fabricantes: contextFabricante.fabricantes
					})
			}).catch((erro) => {
				req.flash("msg_erro", "Não foi possivel listar os fabricantes!" + erro)
				res.redirect("/index")
			})
		}).catch((erro) => {
			req.flash("msg_erro", "Não foi possivel listar os modelos!" + erro)
			res.redirect("/index")
		})
	}).catch((erro) => {
		req.flash("msg_erro", "Não foi possivel listar os produtos!" + erro)
		res.redirect("/index")
	})
}

exports.add = async (req, res) => {
	const novoProduto = await Produto.create({
		descricao: req.body.descricao,
		genero: req.body.genero,
		fabricanteId: req.body.fabricante,
		modeloId: req.body.modelo,
		valorUnitario: req.body.valorUnitario,
		valorCusto: req.body.valorCusto,
		prazoReposicao: req.body.prazoReposicao,
		ativo: req.body.ativo,
	})

	req.flash("msg_sucesso", "Produto salvo com sucesso!")
	res.redirect("/produtos/list-produtos")
}

exports.delete = async (req, res) => {
	const itensVenda = await ItensVenda.findAll({where: {produtoId: req.body.id}})
	const itensCompra = await ItensCompra.findAll({where: {produtoId: req.body.id}})
	if(itensVenda.length < 1 && itensCompra.length < 1){
		Produto.destroy({where: {id: req.body.id}}).then(() => {
			req.flash("msg_sucesso", "Produto deletado com sucesso!")
			res.redirect("/produtos/list-produtos")
		}).catch((erro) => {
			req.flash("msg_erro", "Não foi possivel deletar o produto. Erro: " + erro)
			res.redirect("/produtos/list-produtos")
		})
	}else {
		req.flash("msg_erro", "O produto está sendo utilizado em um registro")
		res.redirect("/produtos/list-produtos")
	}



	Pessoa.findByPk(req.body.id).then((pessoa) => {

	}).catch((erro) => {
		req.flash("msg_erro", "Não foi possivel encontrar o pessoa! " + erro)
		res.redirect("/pessoas/list-pessoas")
	})
}

exports.update = (req, res) => {
	Produto.findByPk(id = req.body.id).then((produto) =>{
		produto.descricao = req.body.descricao,
		produto.genero = req.body.genero,
		produto.fabricanteId = req.body.fabricante,
		produto.modeloId = req.body.modelo,
		produto.valorUnitario = req.body.valorUnitario,
		valorCusto = req.body.valorCusto,
		prazoReposicao = req.body.prazoReposicao,
		produto.ativo = req.body.ativo

		produto.save().then(() => {
			req.flash("msg_sucesso", "Produto editado com sucesso!")
			res.redirect("/produtos/list-produtos")
		}).catch((erro) => {
			req.flash("msg_erro", "Não foi possivel salvar a alteração: " + erro)
			res.redirect("/produtos/list-produtos")
		})
	}).catch((erro) => {
		req.flash("msg_erro", "Não foi possivel encontrar o produto: " + erro)
		res.redirect("/produtos/list-produtos")
	})
}

exports.validar = (req, res) => {
	Produto.findAll({where: {descricao: req.body.campo}}).then((produto) => {
		if(produto.length > 0){
			res.send(true)
		} else {
			res.send(false)
		}
	}).catch((erro) => {
		req.flash("msg_erro", "Houve um erro ao validar!" + erro)
		res.redirect("/produtos/list-produtos")
	})
}
