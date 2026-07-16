import React, { useState } from 'react';
import { Joyride, STATUS, Step } from 'react-joyride';

interface TourTutorialProps {
  run: boolean;
  onFinish: () => void;
  primaryColor?: string;
}

export function TourTutorial({ run, onFinish, primaryColor = '#B38E36' }: TourTutorialProps) {
  const [steps] = useState<Step[]>([
    {
      target: '#nav-settings',
      content: 'Bienvenue sur FacturaPro ! Commencez par configurer votre serveur SMTP et l\'identité visuelle de votre entreprise dans les Paramètres. C\'est indispensable pour l\'envoi d\'emails et la personnalisation de l\'application.',
      placement: 'right',
      disableBeacon: true
    },
    {
      target: '#nav-clients',
      content: 'Ajoutez ensuite vos clients ici. Vous pourrez gérer toutes leurs informations et le suivi commercial.',
      placement: 'right'
    },
    {
      target: '#nav-catalog',
      content: 'Le Catalogue vous permet d\'enregistrer vos articles et services pour les réutiliser rapidement dans vos documents.',
      placement: 'right'
    },
    {
      target: '#nav-invoices',
      content: 'Créez vos devis et factures ici. Une fois générés, vous pourrez les envoyer en 1 clic par Email ou WhatsApp !',
      placement: 'right'
    },
    {
      target: '#nav-reminders',
      content: 'Gérez vos relances d\'impayés depuis ce module. Suivez les retards et agissez proactivement.',
      placement: 'right'
    }
  ]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  return (
    // @ts-ignore: Suppress react-joyride v3 typing issues
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      {...{ callback: handleJoyrideCallback } as any}
      styles={{
        options: {
          primaryColor: primaryColor,
          zIndex: 10000,
        },
        buttonClose: {
          display: 'none',
        }
      } as any}
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Passer le tutoriel',
      }}
    />
  );
}
