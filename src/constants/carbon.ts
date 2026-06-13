/**
 * carbon.ts
 *
 * This file contains constant carbon emission factors (kg CO2 equivalent)
 * for different categories of consumer activities. These constants are derived
 * from standard environmental databases (e.g., Agribalyse, EPA, Ecoinvent).
 */

/**
 * Carbon emission factors for various consumption categories.
 * Values represent kilograms of CO₂ equivalent (kg CO₂e) per unit of consumption.
 */
export const CARBON_CONSTANTS = {
  /** Diet-related emissions per meal or portion */
  food: {
    "Vegetarian meal": 0.5,
    "Chicken meal": 2.5,
    "Beef meal": 7.0,
    "Dairy consumption": 1.2,
  },
  /** Travel-related emissions per kilometer */
  transportation: {
    Car: 0.2, // per km
    Motorcycle: 0.1, // per km
    Metro: 0.03, // per km
    Bus: 0.05, // per km
    Train: 0.04, // per km
    Walking: 0,
    Bicycle: 0,
  },
  /** Household electricity-related emissions per hour or load */
  electricity: {
    "AC usage": 1.2, // per hour
    "Fan usage": 0.05, // per hour
    Refrigerator: 0.1, // per hour
    TV: 0.08, // per hour
    "Washing machine": 0.5, // per load
  },
  /** Consumer goods purchasing-related emissions per item or daily baseline */
  shopping: {
    Clothes: 5.0, // per item
    Electronics: 20.0, // per item
    "Daily purchases": 1.5,
  },
  /** Water-related emissions per unit of action */
  water: {
    Showers: 0.3, // per shower
    Washing: 0.2, // per load
    "Household consumption": 0.5, // daily baseline
  },
  /** Waste-related emissions and offset values per kilogram */
  waste: {
    "Plastic waste": 1.5, // per kg
    Recycling: -0.5, // per kg offset
    Composting: -0.8, // per kg offset
  },
} as const;
