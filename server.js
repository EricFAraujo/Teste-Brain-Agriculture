const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const app = express();
const port = 3001;

// para onfigurando middlewares
app.use(express.json()); // requisições JSON
app.use(cookieParser());
app.use(cors());

// Conexão com o banco de dados PostgreSQL
const pool = new Pool({
  user: 'seu_usuario',
  host: 'seu_host',
  database: 'seu_banco_de_dados',
  password: 'sua_senha',
  port: 5432,
});

// Validação middleware
const validateProducer = [
  body('cpfCnpj').isLength({ min: 11, max: 14 }),
  body('producerName').isString(),
  body('farmName').isString(),
  body('city').isString(),
  body('state').isString(),
  body('totalArea').isNumeric(),
  body('cultivableArea').isNumeric(),
  body('vegetationArea').isNumeric(),
  body('crops').isArray(),
];

// Endpoints

// Get all producers
app.get('/producers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM producers');
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new producer
app.post('/producers', validateProducer, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const newProducer = req.body;

  // Perform additional validation and business logic checks
  // For example, check if the sum of cultivable and vegetation areas is less than or equal to the total area

  try {
    const result = await pool.query(
      'INSERT INTO producers (cpf_cnpj, producer_name, farm_name, city, state, total_area, cultivable_area, vegetation_area, crops) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        newProducer.cpfCnpj,
        newProducer.producerName,
        newProducer.farmName,
        newProducer.city,
        newProducer.state,
        newProducer.totalArea,
        newProducer.cultivableArea,
        newProducer.vegetationArea,
        newProducer.crops,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a producer
app.put('/producers/:id', validateProducer, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const updatedProducer = req.body;
  const producerId = req.params.id;

  // Perform additional validation and business logic checks

  try {
    const result = await pool.query(
      'UPDATE producers SET cpf_cnpj=$1, producer_name=$2, farm_name=$3, city=$4, state=$5, total_area=$6, cultivable_area=$7, vegetation_area=$8, crops=$9 WHERE id=$10 RETURNING *',
      [
        updatedProducer.cpfCnpj,
        updatedProducer.producerName,
        updatedProducer.farmName,
        updatedProducer.city,
        updatedProducer.state,
        updatedProducer.totalArea,
        updatedProducer.cultivableArea,
        updatedProducer.vegetationArea,
        updatedProducer.crops,
        producerId,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a producer
app.delete('/producers/:id', async (req, res) => {
  const producerId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM producers WHERE id=$1 RETURNING *', [producerId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get totals for the dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const totalFarmsResult = await pool.query('SELECT COUNT(*) FROM producers');
    const totalAreaResult = await pool.query('SELECT SUM(total_area) FROM producers');

    // Add more queries for the dashboard statistics as needed

    const dashboardData = {
      totalFarms: totalFarmsResult.rows[0].count,
      totalArea: totalAreaResult.rows[0].sum,
      // Add more properties based on your dashboard requirements
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor está rodando na porta ${port}`);
});
