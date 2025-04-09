// HVAC Prompt Generator for Uncle Jerry Blueprint Analyzer
// This service generates specialized prompts for Claude to analyze HVAC blueprints

import { HVACBlueprintSection, HVACSystemType } from '../types/blueprintTypes';

/**
 * Generates a specialized prompt for Claude to analyze HVAC blueprint sections
 */
export class HVACPromptGenerator {
  
  /**
   * Creates a comprehensive prompt for Claude API to analyze HVAC blueprints
   * @param sections - The blueprint sections to analyze
   * @param systemTypes - The types of HVAC systems to focus on
   * @param projectDetails - Optional additional project details
   * @returns A formatted prompt string for Claude
   */
  public static generateAnalysisPrompt(
    sections: HVACBlueprintSection[],
    systemTypes: HVACSystemType[],
    projectDetails?: any
  ): string {
    // Get descriptions for each system type
    const systemTypeInfo = this.getSystemTypeInfo(systemTypes);
    
    // Main prompt construction
    const prompt = `
You are an expert HVAC estimator specializing in commercial mechanical systems. Analyze these ${sections.length} blueprint sections for a commercial HVAC project.

TASK:
Examine these mechanical blueprint images and create a comprehensive material takeoff and cost estimate for the following HVAC systems: ${systemTypes.join(', ')}.

BLUEPRINT SECTIONS PROVIDED:
${this.describeBlueprintSections(sections)}

FOCUS ON THESE SPECIFIC SYSTEMS:
${systemTypeInfo}

OUTPUT REQUIREMENTS:
1. Materials List: Provide a comprehensive list of all required materials with quantities, unit costs, and total costs.
2. Labor Estimate: Break down installation labor by task, with estimated hours, hourly rates, and total labor costs.
3. Additional Costs: Include permits, equipment rental, testing & balancing, and other project costs.
4. Project Summary: Calculate total materials cost, labor cost, additional costs, project subtotal, and add 10% contingency.
5. Timeline Estimate: Provide a realistic project timeline in weeks.
6. Notes: Include important code considerations, installation requirements, or special conditions.

FORMATTING:
- Structure your response as a formal estimate with clear sections for materials, labor, additional costs, and project summary.
- Include manufacturer and model information where visible in the blueprints.
- If any critical information is missing from the blueprints, note what assumptions you made.

INDUSTRY STANDARDS:
- All HVAC installations must comply with local mechanical codes, building codes, and energy efficiency requirements.
- Kitchen exhaust systems must comply with NFPA 96 and IMC requirements.
- All rooftop equipment must have proper structural support and weatherproofing.
- Include required clearances and access points for maintenance.
`;

    return prompt;
  }
  
  /**
   * Builds a section-by-section description of the blueprints
   */
  private static describeBlueprintSections(sections: HVACBlueprintSection[]): string {
    return sections.map((section, index) => {
      return `Blueprint Section ${index + 1}: ${section.name}
- System Type: ${section.systemType}
${section.floor ? `- Floor: ${section.floor}` : ''}
${section.area ? `- Area: ${section.area}` : ''}
`;
    }).join('\n');
  }
  
  /**
   * Provides specialized information about each system type
   */
  private static getSystemTypeInfo(systemTypes: HVACSystemType[]): string {
    const systemInfo: Record<HVACSystemType, string> = {
      [HVACSystemType.KITCHEN_EXHAUST]: `
KITCHEN EXHAUST SYSTEM:
- Identify hood type, dimensions, and requirements (Type I or Type II)
- List all grease duct components, including straight runs, elbows, cleanouts, and access doors
- Include fire suppression components where required
- Identify exhaust fan specifications, including CFM, static pressure, and motor details
- Include all required fire-rated enclosure materials
- Note required clearances from combustible materials`,

      [HVACSystemType.MAKEUP_AIR]: `
MAKEUP AIR SYSTEM:
- Identify makeup air unit type, capacities, and heating elements
- Include ductwork components and distribution system
- List controls and integration with exhaust systems
- Include roof curbs and mounting hardware
- Detail all required transitions and connections`,

      [HVACSystemType.ROOFTOP_EQUIPMENT]: `
ROOFTOP EQUIPMENT:
- Include detailed specifications for all rooftop units (RTUs)
- List all required curbs, adapters, and structural supports
- Include gas piping, refrigerant piping, and condensate drainage components
- Detail electrical connections and controls
- Include roof penetration flashing and weatherproofing materials
- Note equipment access requirements and service clearances`,

      [HVACSystemType.DUCTWORK]: `
DUCTWORK SYSTEM:
- Calculate quantities for all supply, return, and exhaust ductwork
- Include insulation requirements and materials
- List all required dampers, diffusers, grilles, and registers
- Include duct accessories like turning vanes and access doors
- Note all required support materials and hardware
- Include fire/smoke dampers where required`,

      [HVACSystemType.CONTROLS]: `
CONTROL SYSTEMS:
- Identify all required controllers, sensors, and programming
- List all required wiring, conduit, and connection materials
- Include interface components with building automation systems
- Detail all require
