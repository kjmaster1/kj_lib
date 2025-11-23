import { debugData } from '../../../utils/debugData';

export const debugTextUI = () => {
  debugData<any>([
    {
      action: 'textUi',
      data: {
        text: '[E] - Access locker inventory  \n [G] - Do something else',
        position: 'right-center',
        icon: 'door-open',
      },
    },
  ]);
};
