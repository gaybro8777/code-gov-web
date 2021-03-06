import { Component, OnInit, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Agency, ClientService } from '../../../../../services/client';
import { StatusService } from '../../../../../services/status';

import { Subscription } from 'rxjs/Subscription';
import { SeoService } from '../../../../../services/seo';


@Component({
  selector: 'compliance-dashboard',
  template: require('./compliance-dashboard.template.html')
})

export class ComplianceDashboardComponent implements OnInit, OnDestroy {
  agencyIds: string[] = [];
  public statuses = [];
  public updated;
  private statusesSub: Subscription;

  constructor(
    private clientService: ClientService,
    private statusService: StatusService
  ) {
  }

  ngOnInit() {
    this.getAgencyIds();
    this.getStatuses();
  }

  ngOnDestroy() {
    if (this.statusesSub) this.statusesSub.unsubscribe();
  }


  getAgencyIds() {
    this.clientService.getAgencies().subscribe(
      (agencies: Agency[]) => {
        this.agencyIds = agencies.map(agency => agency.acronym);
      }
    );
  }

  getStatuses() {
    this.statusesSub = this.statusService.getJsonFile().
      subscribe((result) => {
        if (result) {
          for (let statusAgency in result.statuses) {

             // if agencyWidePolicy is null in report.json it means the agency doesn't have
             // to comply, so don't include it in the dash.
             // TODO: should make this more explicit in the API,
            if (result.statuses[statusAgency].requirements['agencyWidePolicy'] !== null) {

              let requirements = [];
              let overallStatus;

              for (let requirement in result.statuses[statusAgency].requirements) {
                if (result.statuses[statusAgency].requirements.hasOwnProperty(requirement)) {
                  const rValue = result.statuses[statusAgency].requirements[requirement];

                  let requirementStatus = 'noncompliant';

                  if (rValue >= 1) {
                    requirementStatus = 'compliant';
                  }
                  if (rValue >= 0.25 && rValue < 1) {
                    requirementStatus = 'partial';
                  }

                  if (requirement !== 'overallCompliance') {
                    requirements.push({ text: requirement, status: requirementStatus });
                  } else {
                   overallStatus = requirementStatus;
                  }
                }
              }

              let codePath = null;

              if (this.agencyIds.find((x) => x === status)) {
                codePath = '/explore-code/agencies/' + status;
              }

              let agency = {
                id: result.statuses[statusAgency].metadata.agency.id,
                name: result.statuses[statusAgency].metadata.agency.name,
                overall: overallStatus,
                codePath: codePath
              };
              this.statuses.push({
                id: statusAgency,
                agency: agency,
                requirements: requirements
              });
              this.updated = result.timestamp;
            }
          }

          this.statuses = this.statuses.sort((a, b) => {
            return a.agency.id - b.agency.id;
          });
        } else {
          console.log('Error.');
        }
    });

  }

  getIcon(status) {
    return `assets/img/logos/agencies/${status.id}.png`;
  }

}
