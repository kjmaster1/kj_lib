import {ClientRPC} from './rpc';
import {Logger} from '../common/logger';
import {Interface} from './interface';
import {Streaming} from './streaming';
import {BoxZone} from './zone';
import {Progress} from './progress';
import {Cache} from './cache';

// Initialize Core Systems
ClientRPC.init();
Cache.init();
Interface.init();
Progress.init();

Logger.info('kj_lib client loaded');

// ==========================================
// TEST COMMANDS
// ==========================================

// --- TEST: Alert Dialog ---
RegisterCommand('kj_alert', async () => {
  Logger.info('Testing Alert Dialog...');

  const response = await Interface.alertDialog({
    header: 'System Alert',
    content: 'Are you sure you want to proceed with this dangerous operation?',
    centered: true,
    cancel: true,
    labels: {
      cancel: 'No, stop',
      confirm: 'Yes, do it'
    }
  });

  Logger.info(`Alert response: ${response}`);
}, false);

// --- TEST: Notification ---
RegisterCommand('kj_notify', () => {
  Interface.notify({
    title: 'Notification Test',
    description: 'This is a success notification test.',
    type: 'success',
    position: 'top-right',
    duration: 5000,
    icon: 'check'
  });
}, false);

// --- TEST: TextUI ---
let isTextUIOpen = false;
RegisterCommand('kj_textui', () => {
  if (isTextUIOpen) {
    Interface.hideTextUI();
    isTextUIOpen = false;
  } else {
    Interface.showTextUI('[E] Interact with Object', {
      position: 'right-center',
      icon: 'hand',
      iconColor: '#3498db'
    });
    isTextUIOpen = true;
  }
}, false);

// --- TEST: Skill Check ---
RegisterCommand('kj_skill', async () => {
  Logger.info('Starting skill check...');

  const success = await Interface.skillCheck(
    {areaSize: 50, speedMultiplier: 1.5},
    ['w', 'a', 's', 'd']
  );

  if (success) {
    Interface.notify({title: 'Skill Check', description: 'Passed!', type: 'success'});
  } else {
    Interface.notify({title: 'Skill Check', description: 'Failed!', type: 'error'});
  }
}, false);

// --- TEST: Progress Bar ---
RegisterCommand('kj_progress', async () => {
  const result = await Progress.start({
    duration: 5000,
    label: 'Repairing Vehicle...',
    useWhileDead: false,
    canCancel: true,
    disable: {
      move: true,
      car: true,
      combat: true
    },
    anim: {
      dict: 'mini@repair',
      clip: 'fixing_a_ped',
    }
  });

  if (result) {
    Interface.notify({title: 'Progress', description: 'Complete!', type: 'success'});
  } else {
    Interface.notify({title: 'Progress', description: 'Cancelled!', type: 'error'});
  }
}, false);

// --- TEST: Context Menu ---
RegisterCommand('kj_context', () => {
  // Register the context menu
  Interface.registerContext({
    id: 'test_context_menu',
    title: 'Interaction Menu',
    options: [
      {
        title: 'Personal ID',
        description: 'View your identification card',
        icon: 'id-card',
        onSelect: () => Logger.info('Viewed ID')
      },
      {
        title: 'Vehicle Actions',
        description: 'Lock/Unlock, Engine',
        icon: 'car',
        arrow: true,
        onSelect: () => Logger.info('Opened Vehicle Actions') // Submenus would usually go here
      },
      {
        title: 'Disabled Item',
        disabled: true,
        description: 'You cannot click this'
      }
    ]
  });

  // Show it
  Interface.showContext('test_context_menu');
}, false);

// --- TEST: Menu (List Menu) ---
RegisterCommand('kj_menu', () => {
  Interface.registerMenu({
    id: 'test_list_menu',
    title: 'Vehicle Spawner',
    position: 'top-right',
    onSelected: (selected, scrollIndex, args) => {
      Logger.info(`Selected item index: ${selected}`);
      if (args) Logger.info(`Item args: ${JSON.stringify(args)}`);
      if (scrollIndex) Logger.info(`Scroll index: ${scrollIndex}`);
    },
    onClose: () => Logger.info('Menu closed'),
    options: [
      {label: 'Spawn Adder', description: 'Super car', args: {model: 'adder'}},
      {label: 'Spawn Police Cruiser', description: 'Emergency vehicle', args: {model: 'police'}},
      {
        label: 'Vehicle Color',
        values: ['Red', 'Blue', 'Green', 'Black'],
        description: 'Select a paint color'
      },
      {label: 'Turbo Tuning', checked: true, description: 'Toggle turbo'}
    ]
  });

  Interface.showMenu('test_list_menu');
}, false);

// --- TEST: Input Dialog (Existing) ---
RegisterCommand('kj_input', async () => {
  const input = await Interface.inputDialog('Police Search', [
    {type: 'input', label: 'Reason for search', required: true},
    {type: 'checkbox', label: 'Confiscate illegal items?'}
  ]);

  if (!input) {
    Logger.info('Input Cancelled');
  } else {
    const [reason, confiscate] = input;
    Logger.info(`Reason: ${reason}, Confiscate: ${confiscate}`);
  }
}, false);

// --- TEST: Model Loading (Existing) ---
RegisterCommand('kj_model', async () => {
  const model = 'adder';
  Logger.info(`Loading model ${model}...`);
  const success = await Streaming.loadModel(model);
  if (success) {
    const ped = PlayerPedId();
    const coords = GetEntityCoords(ped, false);
    CreateVehicle(GetHashKey(model), coords[0] + 2, coords[1], coords[2], 0, true, false);
    Logger.info('Vehicle created!');
  }
}, false);

// --- TEST: RPC Ping (Existing) ---
RegisterCommand('kj_ping', async () => {
  try {
    const response = await ClientRPC.call<string>('kj_lib:ping');
    Logger.info('Server response:', response);
  } catch (e) {
    Logger.error('Ping failed:', e);
  }
}, false);

// --- TEST: Zone ---

// Create a zone around the player's current position when command is run

RegisterCommand('kj_zone', () => {
  const ped = PlayerPedId();
  const coords = GetEntityCoords(ped, false);
  new BoxZone(
    [coords[0], coords[1], coords[2]],
    [2, 2, 2], // 2x2x2 box
    0,
    {
      debug: true,
      onEnter: () => Logger.info('Entered Zone!'),
      onExit: () => Logger.info('Exited Zone!'),
      inside: () => {
        // Draw text while inside
        SetTextFont(0);
        SetTextProportional(true);
        SetTextScale(0.0, 0.5);
        SetTextColour(255, 255, 255, 255);
        BeginTextCommandDisplayText("STRING");
        AddTextComponentSubstringPlayerName("You are inside the BoxZone");
        EndTextCommandDisplayText(0.5, 0.5);
      }
    }
  );
  Logger.info('Debug Zone Created at your position');
}, false);
