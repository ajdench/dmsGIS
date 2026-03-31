import { describe, expect, it } from 'vitest';
import { buildWorkspaceBottomCardModel } from '../src/lib/workspaceBottomCards';

describe('workspaceBottomCards', () => {
  it('builds PMC cards for the Current preset', () => {
    const model = buildWorkspaceBottomCardModel({
      activeViewPreset: 'current',
      regions: [
        {
          name: 'Scotland & Northern Ireland',
          visible: true,
          color: '#223344',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#556677',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
        {
          name: 'North',
          visible: true,
          color: '#112233',
          opacity: 0.35,
          shape: 'diamond',
          borderVisible: true,
          borderColor: '#445566',
          borderWidth: 2,
          borderOpacity: 0.5,
          symbolSize: 3.5,
        },
      ],
      regionGroupOverrides: {},
      pmcRegionParDisplayByName: {
        'Scotland & Northern Ireland': '1,000',
        North: '2,000',
      },
      pmcTotalParDisplay: '45,000',
      presetRegionParByPreset: {},
    });

    expect(model.slots).toHaveLength(9);
    expect(model.slots[0]).toMatchObject({
      title: 'Scotland & NI',
    });
    expect(model.slots[1]).toMatchObject({
      title: 'North',
      parDisplay: '2,000',
      swatch: {
        color: '#112233',
        shape: 'diamond',
        borderColor: '#445566',
        borderOpacity: 0.5,
        borderWidth: 2,
      },
    });
    expect(model.totalCard).toMatchObject({
      title: 'Total',
      parDisplay: '45,000',
    });
  });

  it('can regionalise Royal Navy PAR into Current parent region cards without double counting', () => {
    const model = buildWorkspaceBottomCardModel({
      activeViewPreset: 'current',
      regions: [
        {
          name: 'Scotland & Northern Ireland',
          visible: true,
          color: '#112233',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#445566',
          borderWidth: 2,
          borderOpacity: 0.5,
          symbolSize: 3.5,
        },
        {
          name: 'Royal Navy',
          visible: true,
          color: '#000080',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#111111',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
      ],
      regionGroupOverrides: {},
      pmcRegionParDisplayByName: {
        'Scotland & Northern Ireland': '2,000',
        'Royal Navy': '10,000',
      },
      pmcTotalParDisplay: '45,000',
      presetRegionParByPreset: {},
      presetRoyalNavyRegionalParByPreset: {
        current: {
          'Scotland & Northern Ireland': 3000,
        },
      },
      showRoyalNavyRegionalization: true,
    });

    expect(model.slots[0]).toMatchObject({
      parDisplay: '5,000',
      middleRow: {
        kind: 'royalNavyContribution',
        valueDisplay: '3,000',
      },
    });
    expect(model.slots[8]).toMatchObject({
      title: 'Royal Navy',
      parDisplay: '—',
      middleRow: {
        kind: 'button',
        label: 'Unregionalise',
      },
    });
  });

  it('builds SJC JMC cards from the Regions pane group model', () => {
    const model = buildWorkspaceBottomCardModel({
      activeViewPreset: 'coa3a',
      regions: [
        {
          name: 'Overseas',
          visible: true,
          color: '#808080',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#111111',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
        {
          name: 'Royal Navy',
          visible: true,
          color: '#000080',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#111111',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
      ],
      regionGroupOverrides: {
        'JMC North': {
          visible: true,
          populatedFillVisible: true,
          unpopulatedFillVisible: true,
          populatedFillColor: '#123456',
          unpopulatedFillColor: null,
          populatedOpacity: 0.35,
          unpopulatedOpacity: 0.25,
          borderVisible: false,
          borderColor: '#ffffff',
          borderOpacity: 0,
          borderWidth: 1,
        },
      },
      pmcRegionParDisplayByName: {},
      pmcTotalParDisplay: '45,000',
      presetRegionParByPreset: {
        coa3a: {
          'JMC Scotland': 1000,
          'JMC Northern Ireland': 2000,
          'JMC Wales': 3000,
          'JMC North': 4000,
          'JMC Centre': 5000,
          'JMC South West': 6000,
          'JMC South East': 7000,
          'London District': 8000,
          Overseas: 9000,
          'Royal Navy': 10000,
        },
      },
    });

    expect(model.slots.map((slot) => slot?.title ?? null)).toEqual([
      'Devolved Admin...',
      'North',
      'Centre',
      'South West',
      'South East',
      'London District',
      null,
      'Overseas',
      'Royal Navy',
    ]);
    expect(model.slots[0]).toMatchObject({
      swatch: {
        color: '#4862b8',
        shape: 'circle',
      },
      parDisplay: '6,000',
    });
    expect(model.slots[1]).toMatchObject({
      swatch: {
        color: '#123456',
        shape: 'circle',
      },
      parDisplay: '4,000',
    });
    expect(model.slots[7]).toMatchObject({
      swatch: {
        color: '#808080',
        shape: 'circle',
      },
      parDisplay: '9,000',
    });
    expect(model.slots[8]).toMatchObject({
      swatch: {
        color: '#000080',
        shape: 'circle',
      },
      parDisplay: '10,000',
      middleRow: {
        kind: 'button',
        label: 'Regionalise',
      },
    });
    expect(model.totalCard).toMatchObject({
      title: 'Total',
      parDisplay: '45,000',
    });
  });

  it('can regionalise Royal Navy PAR into the scenario parent cards without double counting', () => {
    const model = buildWorkspaceBottomCardModel({
      activeViewPreset: 'coa3a',
      regions: [
        {
          name: 'Overseas',
          visible: true,
          color: '#808080',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#111111',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
        {
          name: 'Royal Navy',
          visible: true,
          color: '#000080',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#111111',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
      ],
      regionGroupOverrides: {},
      pmcRegionParDisplayByName: {},
      pmcTotalParDisplay: '45,000',
      presetRegionParByPreset: {
        coa3a: {
          'JMC Scotland': 1000,
          'JMC Northern Ireland': 2000,
          'JMC Wales': 3000,
          'JMC North': 4000,
          'JMC Centre': 5000,
          'JMC South West': 6000,
          'JMC South East': 7000,
          'London District': 8000,
          Overseas: 9000,
          'Royal Navy': 10000,
        },
      },
      presetRoyalNavyRegionalParByPreset: {
        coa3a: {
          'JMC Scotland': 7000,
          'JMC North': 3000,
        },
      },
      showRoyalNavyRegionalization: true,
    });

    expect(model.slots[0]).toMatchObject({
      parDisplay: '13,000',
      middleRow: {
        kind: 'royalNavyContribution',
        valueDisplay: '7,000',
      },
    });
    expect(model.slots[1]).toMatchObject({
      parDisplay: '7,000',
      middleRow: {
        kind: 'royalNavyContribution',
        valueDisplay: '3,000',
      },
    });
    expect(model.slots[8]).toMatchObject({
      parDisplay: '—',
      middleRow: {
        kind: 'button',
        label: 'Unregionalise',
      },
    });
  });

  it('builds COA 3a cards with pinned Overseas and Royal Navy slots', () => {
    const model = buildWorkspaceBottomCardModel({
      activeViewPreset: 'coa3b',
      regions: [
        {
          name: 'Overseas',
          visible: true,
          color: '#808080',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#111111',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
        {
          name: 'Royal Navy',
          visible: true,
          color: '#000080',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#111111',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
      ],
      regionGroupOverrides: {},
      pmcRegionParDisplayByName: {},
      pmcTotalParDisplay: '45,000',
      presetRegionParByPreset: {
        coa3b: {
          'COA 3a Devolved Administrations': 1000,
          'COA 3a North': 2000,
          'COA 3a Midlands': 3000,
          'COA 3a South West': 4000,
          'COA 3a South East': 5000,
          Overseas: 6000,
          'Royal Navy': 7000,
        },
      },
    });

    expect(model.slots.map((slot) => slot?.title ?? null)).toEqual([
      'Devolved Admin...',
      'North',
      'Midlands',
      'South West',
      'South East',
      null,
      null,
      'Overseas',
      'Royal Navy',
    ]);
  });

  it('builds COA 3b cards with pinned Overseas and Royal Navy slots', () => {
    const model = buildWorkspaceBottomCardModel({
      activeViewPreset: 'coa3c',
      regions: [
        {
          name: 'Overseas',
          visible: true,
          color: '#808080',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#111111',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
        {
          name: 'Royal Navy',
          visible: true,
          color: '#000080',
          opacity: 0.35,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#111111',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
      ],
      regionGroupOverrides: {},
      pmcRegionParDisplayByName: {},
      pmcTotalParDisplay: '45,000',
      presetRegionParByPreset: {
        coa3c: {
          'COA 3b Devolved Administrations': 1000,
          'COA 3b North': 2000,
          'COA 3b Midlands': 3000,
          'COA 3b South West': 4000,
          'COA 3b South East': 5000,
          'COA 3b London and East': 6000,
          Overseas: 7000,
          'Royal Navy': 8000,
        },
      },
    });

    expect(model.slots.map((slot) => slot?.title ?? null)).toEqual([
      'Devolved Admin...',
      'North',
      'Midlands',
      'South West',
      'South East',
      'London\nand East',
      null,
      'Overseas',
      'Royal Navy',
    ]);
  });
});
