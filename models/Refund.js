const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

    const Refund = sequelize.define('Refund', {
        payment_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        email_address: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true, 
            },
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending', 
        },
    });

    Refund.associate = (models) => {
        // Define relationships with other models if necessary
    };

    return Refund;
