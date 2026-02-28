const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animal.controller');
const { protect } = require('../middlewares/auth.middleware');

// All routes protected
router.get('/stats', protect, animalController.getAnimalStats);
router.get('/', protect, animalController.getAllAnimals);
router.get('/:id', protect, animalController.getAnimalById);
router.post('/', protect, animalController.createAnimal);
router.put('/:id', protect, animalController.updateAnimal);
router.delete('/:id', protect, animalController.deleteAnimal);

module.exports = router;