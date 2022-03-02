const express = require("express");
const { v4: uuidv4 } = require ("uuid")

const app = express();

app.use(express.json());

const customers = [];

// MIDDLEWARE
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if(!customer)
     return response.status(400).json({ error: "Customer not found" });

     
     request.customer = customer;
     return next ()
}

function getBalance (statement) {
  const balence = statement.reduce((acc, operation)=>{
   if(operation.type === 'credit') {
     return acc + operation.amount;
   }else {
     return acc - operation.amount;
   }

  }, 0);
  return balence;
}
// CRIANDO UMA CONTA E NÃO PERMITINDO O MESMO CPF SE CADASTRAR
// VOU CRIAR UMA CONTA QUAL METEDO USO? METODO POST
   app.post("/account", (request, response) =>{
// EM INSERÇÃO DE DADOS EU USO O PARAMETRO BODY
// VOU FAZER UMA DESESTRUTURAÇÃO NA VARIAVEL PARA RECEBER CPF E NOME QUE ESTA VINDO DO R.BODY
   const { cpf, name } = request.body;
 

   // ATÉ O IF SÃO AS LINHAS DE CODIGO QUE DIZ QUE JA TEM UMA CONTA CADASTRADA
   const customerAlreadyExists =customers.some((customer)=>customer.cpf === cpf);

   if (customerAlreadyExists) {
       return response.status(400).json({error: "Customer already exists!" });
   }

   const id = uuidv4();
   
   customers.push({
       cpf,
       name,
       id: uuidv4(),
       statement: []
   })

   return response.status(201).send();


   });


   // BUSCANDO EXTRATO BANCARIO DO CLIENTE
   // NÃO DEVE SER POSSIVEL TIRAR EXTRATO DE QUEM NAO É CLIENTE
   app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request; 

    return response.json(customer.statement)
   });

   app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
     const { description, amount } = request.body;

     const { customer } = request;

const statementOperetion = {
  description,
  amount,
  createdAt: new Date (),
  type: "credit" 

}
   customer.statement.push(statementOperetion);

   return response. status(201).send();
 });

 app.post("/withdraw", verifyIfExistsAccountCPF, (request, response)=>{
 const { amount } = request.body; 
 const { customer } = request;

 const balance = getBalance(customer.statement);

 if(balance < amount) {
   return response.status(400).json({error: "Insufficient funds!"})
 }
  const statementOperetion = {
    amount,
    createdAt :new Date(),
    type: "debit",
  };   

  customer.statement.push(statementOperetion);

  return response.status(201).send();
 
 });

 // CONSULTA DE EXTRATO BANCARIO COM DATA  
 app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request; 
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");  
  const statement = customer.statement.filter(
    (statement)=>
     statement.createdAt.toDateString()=== 
     new Date (dateFormat).toDateString());
 

  return response.json(statement) 
 });

 app.put("/account",verifyIfExistsAccountCPF, (request, response) => {
   const { name } = request.body;
   const { customer } = request;

   customer.name = name;

   return response.status(201).send()
 });

 app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
   const { customer } = request;

   return response.json(customer); 
 }); 

 app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
   const { customer } = request;

   //splice 
   customers.splice(customer, 1);

   return response.status(200).json(customers);
 });

 app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(2121);
 