var db = require("../config/conexao")
const Pessoa = require("../models/Pessoa")
const Venda = require("../models/Venda")
const Produto = require("../models/Produto")
const ContasReceber = require("../models/ContasReceber")
const ContasPagar = require("../models/ContasPagar")
var Erro = require('../helpers/Erro')

var date = new Date();
var month = date.getMonth() + 1;
var year = date.getFullYear();

const Querys = {
	valorTotalEmEstoque: 'SELECT Sum("quantidade" * "valorUnitario") as "vlrTotEmEstoque" FROM "produtos"',

	valorRecebimentosAnual: 'SELECT EXTRACT(MONTH FROM "dataDeVencimento") AS "mes", ' +
	'Sum("valorDaParcela") as "vlrRecebAnual"' +
	'FROM "parcela_recebimentos" '+
	'WHERE EXTRACT(YEAR FROM "dataDeVencimento") = ' + year +
	' GROUP BY EXTRACT(MONTH FROM "dataDeVencimento") ' +
	'ORDER BY EXTRACT(MONTH FROM "dataDeVencimento") ASC',

	valorPagamentosAnual: 'SELECT EXTRACT(MONTH FROM "dataDeVencimento") AS "mes", ' +
	'Sum("valorDaParcela") as "vlrPagaAnual"' +
	'FROM "parcela_pagamentos" '+
	'WHERE EXTRACT(YEAR FROM "dataDeVencimento") = ' + year +
	' GROUP BY EXTRACT(MONTH FROM "dataDeVencimento") ' +
	'ORDER BY EXTRACT(MONTH FROM "dataDeVencimento") ASC',

	vlrRecebidoNoMes: 'SELECT SUM("valorPago") ' +
	'FROM parcela_recebimentos '+
	'WHERE EXTRACT(MONTH FROM "dataDeVencimento") = ' + month + ' AND status = true',

	vlrAReceberNoMes: 'SELECT SUM("valorDaParcela") ' +
	'FROM parcela_recebimentos ' +
	'WHERE EXTRACT(MONTH FROM "dataDeVencimento") = ' + month,

	vlrPagoNoMes: 'SELECT SUM("valorPago") ' +
	'FROM parcela_pagamentos ' +
	'WHERE EXTRACT(MONTH FROM "dataDeVencimento") = ' + month + ' AND status = true',

	vlrAPagarNoMes: 'SELECT SUM("valorDaParcela") ' +
	'FROM parcela_pagamentos ' +
	'WHERE EXTRACT(MONTH FROM "dataDeVencimento") = ' + month,

	lucratividade: 'SELECT "descricao", ("valorUnitario" - "valorCusto") AS "lucratividade", ' +
	'CAST((("valorUnitario" - "valorCusto") / "valorUnitario") * 100 AS DECIMAL(10,2)) AS "margemDeLucro" ' +
	'FROM "produtos" ORDER BY "lucratividade" DESC LIMIT 5',

	estoqueDeSeguranca:
	`SELECT P."descricao",
	P."id",
	P."quantidade",
	P."prazoReposicao",
	CAST((COALESCE(
		(SELECT
			SUM(iv."quantidade") * P."prazoReposicao"
			FROM "itens_vendas" iv
			INNER JOIN "vendas" v on v."id" = iv."vendaId"
			WHERE P."id" = iv."produtoId" AND v."dataVenda" > CURRENT_DATE - INTERVAL '30 days'
			GROUP BY iv."produtoId"
		),
		COALESCE(
			(SELECT
				SUM(iv."quantidade") * P."prazoReposicao"
				FROM "itens_vendas" iv
				INNER JOIN "vendas" v on v."id" = iv."vendaId"
				WHERE P."id" = iv."produtoId"
				GROUP BY iv."produtoId"
			),
			P."quantidade"
		)
	)) AS DECIMAL(10,2) ) + (CAST((COALESCE(
		CAST((SELECT
			SUM(iv."quantidade")
			FROM "itens_vendas" iv
			INNER JOIN "vendas" v on v."id" = iv."vendaId"
			WHERE P."id" = iv."produtoId" AND v."dataVenda" > CURRENT_DATE - INTERVAL '30 days'
			GROUP BY iv."produtoId"
		) AS DECIMAL(10,2) ), COALESCE(CAST((SELECT
			SUM(iv."quantidade")
			FROM "itens_vendas" iv
			INNER JOIN "vendas" v on v."id" = iv."vendaId"
			WHERE P."id" = iv."produtoId"
			GROUP BY iv."produtoId"
		) AS DECIMAL(10,2) ), 0)) / 30) AS DECIMAL(10,2) ) * P."prazoReposicao") AS "pontoDePedido"
		FROM "produtos" P
		LEFT JOIN "itens_vendas" iv on P."id" = iv."produtoId"
		GROUP BY P."id"
		ORDER BY P."quantidade" ASC
		LIMIT 5`,
	}

	exports.listAll = (req, res, next) => {
		Pessoa.count({where: {funcao: 'Cliente'}}).then(totalClientesCadastrados => {
			Pessoa.count({where: {funcao: 'Fornecedor'}}).then(totalFornecedoresCadastrados => {
				Venda.count().then(vendasRealizadas => {
					Produto.count().then(totalProdutosCadastrados => {
						db.query(Querys.valorTotalEmEstoque, { type: db.QueryTypes.SELECT})
						.then(valorTotalEmEstoque => {
							db.query(Querys.valorRecebimentosAnual, { type: db.QueryTypes.SELECT})
							.then(valorRecebimentosAnual => {
								db.query(Querys.valorPagamentosAnual, { type: db.QueryTypes.SELECT})
								.then(valorPagamentosAnual => {

									db.query(Querys.vlrRecebidoNoMes, { type: db.QueryTypes.SELECT})
									.then(vlrRecebidoNoMes => {
										var valorRecebidoNoMes = vlrRecebidoNoMes[0].sum
										db.query(Querys.vlrAReceberNoMes, { type: db.QueryTypes.SELECT})
										.then(vlrAReceberNoMes => {
											var valorAReceberNoMes = vlrAReceberNoMes[0].sum
											db.query(Querys.vlrPagoNoMes, { type: db.QueryTypes.SELECT})
											.then(vlrPagoNoMes => {
												var valorPagoNoMes = vlrPagoNoMes[0].sum
												db.query(Querys.vlrAPagarNoMes, { type: db.QueryTypes.SELECT})
												.then(vlrAPagarNoMes => {
													db.query(Querys.lucratividade, { type: db.QueryTypes.SELECT})
													.then(lucratividade => {
														db.query(Querys.estoqueDeSeguranca, { type: db.QueryTypes.SELECT})
														.then(estoqueDeSeguranca => {

															var valorAPagarNoMes = vlrAPagarNoMes[0].sum

															if(valorRecebidoNoMes == null) {
																valorRecebidoNoMes = 0.00
															}
															if(valorAReceberNoMes == null) {
																valorAReceberNoMes = 0.00
															}
															if(valorPagoNoMes == null) {
																valorPagoNoMes = 0.00
															}
															if(valorAPagarNoMes == null) {
																valorAPagarNoMes = 0.00
															}
															var porcentagemRecebido = CalcPorcentagem(valorRecebidoNoMes, valorAReceberNoMes)
															var diferencaRecebimento = Diferenca(valorRecebidoNoMes, valorAReceberNoMes).toFixed(2)

															var porcentagemPago = CalcPorcentagem(valorPagoNoMes, valorAPagarNoMes)
															var diferencaPagamento = Diferenca(valorPagoNoMes, valorAPagarNoMes).toFixed(2)

															Venda.sum('valorTotal').then(vlrTotVendas => {
																var valorTotalVendas = parseFloat(vlrTotVendas).toFixed(2);
																res.render("index", {
																	totalClientesCadastrados: totalClientesCadastrados,
																	totalFornecedoresCadastrados: totalFornecedoresCadastrados,
																	totalProdutosCadastrados: totalProdutosCadastrados,
																	vendasRealizadas: vendasRealizadas,
																	valorTotalEmEstoque: valorTotalEmEstoque,
																	valorRecebimentosAnual: valorRecebimentosAnual,
																	valorPagamentosAnual: valorPagamentosAnual,
																	valorRecebidoNoMes: valorRecebidoNoMes,
																	valorAReceberNoMes: valorAReceberNoMes,
																	valorTotalVendas: valorTotalVendas,
																	porcentagemRecebido: porcentagemRecebido,
																	diferencaRecebimento: diferencaRecebimento,
																	valorPagoNoMes: valorPagoNoMes,
																	valorAPagarNoMes: valorAPagarNoMes,
																	porcentagemPago: porcentagemPago,
																	diferencaPagamento: diferencaPagamento,
																	lucratividade: lucratividade,
																	estoqueDeSeguranca: estoqueDeSeguranca
																});
															}).catch((erro) => {
																Erro.erro(req, res, next, 'Não foi possivel buscar valor total das vendas! ' + erro)
															})
														}).catch((erro) => {
															Erro.erro(req, res, next, 'Não foi possivel buscar estoque de segurança! ' + erro)
														})
													}).catch((erro) => {
														Erro.erro(req, res, next, 'Não foi possivel buscar lucratividade dos produtos! ' + erro)
													})
												}).catch((erro) => {
													Erro.erro(req, res, next, 'Não foi possivel buscar valor a pagar no mes! ' + erro)
												})
											}).catch((erro) => {
												Erro.erro(req, res, next, 'Não foi possivel buscar valor pago no mes! ' + erro)
											})
										}).catch((erro) => {
											Erro.erro(req, res, next, 'Não foi possivel buscar valor a receber no mes! ' + erro)
										})
									}).catch((erro) => {
										Erro.erro(req, res, next, 'Não foi possivel buscar valor recebido no mes! ' + erro)
									})

								}).catch((erro) => {
									Erro.erro(req, res, next, 'Não foi possivel buscar valor dos pagamentos realizados no ano! ' + erro)
								})
							}).catch((erro) => {
								Erro.erro(req, res, next, 'Não foi possivel buscar valor dos recebimentos realizados no ano! ' + erro)
							})
						}).catch((erro) => {
							Erro.erro(req, res, next, 'Não foi possivel buscar valor total dos produtos em estoque! ' + erro)
						})
					}).catch((erro) => {
						Erro.erro(req, res, next, 'Não foi possivel buscar total de produtos cadastrados! ' + erro)
					})
				}).catch((erro) => {
					Erro.erro(req, res, next, 'Não foi possivel buscar total de vendas realizadas! ' + erro)
				})
			}).catch((erro) => {
				Erro.erro(req, res, next, 'Não foi possivel buscar total de fornecedores cadastrados! ' + erro)
			})
		}).catch((erro) => {
			Erro.erro(req, res, next, 'Não foi possivel buscar total de clientes cadastrados! ' + erro)
		})
	}


	CalcPorcentagem = (vlrRecebidoPago, vlrReceberPagar) => {
		if (vlrReceberPagar == 0 || vlrRecebidoPago == 0) {
			return 0;
		} else {
			return porcentagem = Math.round((vlrRecebidoPago * 100) / vlrReceberPagar)
		}
	}

	Diferenca = (vlrRecebidoPago, vlrReceberPagar) => {
		return diferenca = vlrReceberPagar - vlrRecebidoPago
	}
