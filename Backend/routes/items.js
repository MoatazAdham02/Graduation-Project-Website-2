import express from 'express';
import Item from '../models/Item.js';

const router = express.Router();

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (err) {
    console.error('❌ Get items error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to get items'
    });
  }
});

// Create new item
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    // Create item
    const item = await Item.create({
      name: name.trim(),
      description: description?.trim() || ''
    });

    console.log(`✅ Item created: ${item.name}`);

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item
    });
  } catch (err) {
    console.error('❌ Create item error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create item'
    });
  }
});

// Update item
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (name && !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Name cannot be empty'
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() })
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    console.log(`✅ Item updated: ${item.name}`);

    res.json({
      success: true,
      message: 'Item updated successfully',
      item
    });
  } catch (err) {
    console.error('❌ Update item error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to update item'
    });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    console.log(`✅ Item deleted: ${item.name}`);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (err) {
    console.error('❌ Delete item error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to delete item'
    });
  }
});

export default router;
