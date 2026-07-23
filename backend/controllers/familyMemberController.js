const db = require('../config/db');

exports.addFamilyMember = async (req, res) => {
  try {
    const { resident_id, name, relation, phone, email } = req.body;
    if (!resident_id || !name) return res.status(400).json({ message: 'resident_id and name are required' });

    const [result] = await db.query(
      `INSERT INTO family_members (resident_id, name, relation, phone, email) VALUES (?, ?, ?, ?, ?)`,
      [resident_id, name, relation || null, phone || null, email || null]
    );
    res.status(201).json({ message: 'Family member added', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding family member' });
  }
};

exports.getFamilyMembers = async (req, res) => {
  try {
    const { residentId } = req.params;
    const [rows] = await db.query('SELECT * FROM family_members WHERE resident_id = ?', [residentId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching family members' });
  }
};

exports.deleteFamilyMember = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM family_members WHERE id = ?', [id]);
    res.json({ message: 'Family member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error removing family member' });
  }
};