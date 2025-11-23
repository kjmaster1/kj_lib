// src/client/debug.ts
import {Logger} from '../common';
import {Interface} from './interface';
import {Progress} from './progress';
import {Streaming} from './streaming';
import {BoxZone} from './zone';
import {ClientRPC} from './rpc';

export class Debug {
  static init() {
    // --- TEST: Alert Dialog ---
    RegisterCommand('kj_alert', async () => {
      Logger.debug('Testing Alert Dialog...');
      const response = await Interface.alertDialog({
        header: 'System Alert',
        content: 'Are you sure you want to proceed with this dangerous operation?',
        centered: true,
        cancel: true,
        labels: {cancel: 'No, stop', confirm: 'Yes, do it'}
      });
      Logger.debug(`Alert response: ${response}`);
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
      Logger.debug('Starting skill check...');
      const success = await Interface.skillCheck(
        {areaSize: 50, speedMultiplier: 1.5},
        ['w', 'a', 's', 'd']
      );
      const type = success ? 'success' : 'error';
      Interface.notify({title: 'Skill Check', description: success ? 'Passed!' : 'Failed!', type});
    }, false);

    // --- TEST: Progress Bar ---
    RegisterCommand('kj_progress', async () => {
      const result = await Progress.start({
        duration: 5000,
        label: 'Repairing Vehicle...',
        useWhileDead: false,
        canCancel: true,
        disable: {move: true, car: true, combat: true},
        anim: {dict: 'mini@repair', clip: 'fixing_a_ped'}
      });
      const type = result ? 'success' : 'error';
      Interface.notify({title: 'Progress', description: result ? 'Complete!' : 'Cancelled!', type});
    }, false);

    // --- TEST: Context Menu ---
    RegisterCommand('kj_context', () => {
      Interface.registerContext({
        id: 'test_context_menu',
        title: 'Interaction Menu',
        options: [
          {
            title: 'Personal ID',
            description: 'View your identification card',
            icon: 'id-card',
            onSelect: () => Logger.debug('Viewed ID')
          },
          {
            title: 'Vehicle Actions',
            description: 'Lock/Unlock, Engine',
            icon: 'car',
            arrow: true,
            onSelect: () => Logger.debug('Opened Vehicle Actions')
          },
          {
            title: 'Disabled Item',
            disabled: true,
            description: 'You cannot click this'
          }
        ]
      });
      Interface.showContext('test_context_menu');
    }, false);

    // --- TEST: Menu (List Menu) ---
    RegisterCommand('kj_menu', () => {
      Interface.registerMenu({
        id: 'test_list_menu',
        title: 'Vehicle Spawner',
        position: 'top-right',
        onSelected: (selected: number, scrollIndex?: number, args?: any) => {
          Logger.debug(`Selected: ${selected}`, args);
        },
        options: [
          {label: 'Spawn Adder', description: 'Super car', args: {model: 'adder'}},
          {label: 'Spawn Police', description: 'Emergency vehicle', args: {model: 'police'}},
          {label: 'Vehicle Color', values: ['Red', 'Blue', 'Green'], description: 'Select paint'},
          {label: 'Turbo Tuning', checked: true, description: 'Toggle turbo'}
        ]
      });
      Interface.showMenu('test_list_menu');
    }, false);

    // --- TEST: Input Dialog ---
    RegisterCommand('kj_input', async () => {
      const input = await Interface.inputDialog('Police Search', [
        {type: 'input', label: 'Reason for search', required: true},
        {type: 'checkbox', label: 'Confiscate illegal items?'}
      ]);
      if (input) {
        Logger.debug(`Input: ${JSON.stringify(input)}`);
      } else {
        Logger.debug('Input Cancelled');
      }
    }, false);

    // --- TEST: Model Loading ---
    RegisterCommand('kj_model', async () => {
      const model = 'adder';
      if (await Streaming.loadModel(model)) {
        const ped = PlayerPedId();
        const coords = GetEntityCoords(ped, false);
        CreateVehicle(GetHashKey(model), coords[0] + 2, coords[1], coords[2], 0, true, false);
        Logger.debug('Vehicle created!');
      }
    }, false);

    // --- TEST: RPC Ping ---
    RegisterCommand('kj_ping', async () => {
      try {
        const response = await ClientRPC.call<string>('kj_lib:ping');
        Logger.debug('Server response:', response);
      } catch (e) {
        Logger.error('Ping failed:', e);
      }
    }, false);

    // --- TEST: Zone ---
    RegisterCommand('kj_zone', () => {
      const ped = PlayerPedId();
      const coords = GetEntityCoords(ped, false);
      new BoxZone(
        {x: coords[0], y: coords[1], z: coords[2]},
        {x: 2, y: 2, z: 2},
        0,
        {
          debug: true,
          onEnter: () => Logger.debug('Entered Zone!'),
          onExit: () => Logger.debug('Exited Zone!'),
          inside: () => {
            Interface.showTextUI('Inside Debug Zone');
          }
        }
      );
      Logger.debug('Debug Zone Created');
    }, false);
  }
}
