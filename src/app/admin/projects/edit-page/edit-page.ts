import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';

interface PageImage { src: string; alt?: string; }
interface EditableItem { title?: string; description: string; }
interface EditableSection {
  headingFirst: string;
  headingSecond: string;
  subtitle?: string;
  paragraphs: string[];
  items: EditableItem[];
  images: PageImage[];
  quote?: string;
}
interface BrandingColor { hex: string; name: string; }
interface BrandingContent {
  overview: string;
  typography: string;
  colors: BrandingColor[];
  theme: string;
  logoDesign: string;
}
interface PageContent {
  overview: { clientLogo: string; client: string; duration: string; geoScope: string; domain: string; productScale: string; };
  context: EditableSection;
  challenge: EditableSection;
  approach: EditableSection;
  transformation: EditableSection;
  impact: EditableSection;
  certifications: EditableSection;
  relatedProjectIds: string[];
  branding: BrandingContent;
}
interface EditableProject {
  id: string; _id?: string; title: string; description: string; year: number;
  serialNo?: number; coverImage: string; slug: string; status?: 'draft' | 'published';
}

@Component({
  selector: 'app-edit-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-page.html',
  styleUrl: './edit-page.css'
})
export class EditPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly apiUrl = 'https://company-portfolio-api.onrender.com/projects';

  @ViewChild('slider') slider?: ElementRef<HTMLElement>;

  project: EditableProject | null = null;
  loading = true;
  error = '';
  saveError = '';
  saveSuccess = '';
  editingSection: string | null = null;
  savingSection: string | null = null;
  showAssociateProjects = false;
  availableProjects: EditableProject[] = [];
  selectedRelatedProjectIds: string[] = [];
  projectSearch = '';
  sectionErrors: Record<string, string> = {};
  activeTab = 'Overview';
  tabList = ['Overview', 'Branding'];

  page: PageContent = this.createDefaultPage();
  draft: PageContent = this.createDefaultPage();
  activeIndex = 0;
  isDragging = false;
  private pointerStartX: number | null = null;
  private pointerStartScroll = 0;
  private autoplayTimer?: ReturnType<typeof setInterval>;

  get filteredProjects(): EditableProject[] {
    const search = this.projectSearch.trim().toLowerCase();
    return this.availableProjects.filter(p => !search || p.title.toLowerCase().includes(search));
  }

  get relatedProjectCards(): EditableProject[] {
    const ids = this.page.relatedProjectIds;
    return ids.map(id => this.availableProjects.find(p => p.id === id) ?? null)
      .filter((p): p is EditableProject => !!p);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Project ID is missing from the route.';
      this.loading = false;
      return;
    }
    this.http.get<any>(`${this.apiUrl}/${encodeURIComponent(id)}`).pipe(
      catchError(err => {
        this.error = err?.error?.message || 'Unable to load the selected project.';
        this.loading = false;
        return of(null);
      })
    ).subscribe(project => {
      if (!project) return;
      this.project = { ...project, id: String(project.id ?? project._id ?? id) } as EditableProject;
      this.loadAvailableProjects();
      this.loadPageContent(this.project.id);
    });
  }

  private createDefaultPage(): PageContent {
    return {
      overview: {
        clientLogo: 'assets/images/clients/national-conference-of-chief-secretaries.svg',
        client: 'NITI Aayog, UNDP',
        duration: '6 Months',
        geoScope: 'Pan-India',
        domain: 'National Governance & Digital Transformation Initiative',
        productScale: 'National / Multi-State / Government Leadership'
      },
      context: {
        headingFirst: 'The', headingSecond: 'Context', subtitle: 'Where Governance Meets Collaboration',
        paragraphs: [
          'The National Conference of Chief Secretaries brings together the highest levels of administrative leadership to deliberate on national priorities, strengthen Centre–State collaboration and accelerate the implementation of shared development agendas.',
          'Our role was to transform this institutional ecosystem into a powerful digital experience, making critical information, knowledge and outcomes more accessible, structured and connected.'
        ],
        items: [],
        images: [
          { src: 'assets/images/slider_1.jpg', alt: 'Conference platform image 1' },
          { src: 'assets/images/slider_2.jpg', alt: 'Conference platform image 2' },
          { src: 'assets/images/slider_2.jpg', alt: 'Conference platform image 3' },
          { src: 'assets/images/slider_1.jpg', alt: 'Conference platform image 4' }
        ]
      },
      challenge: {
        headingFirst: 'The', headingSecond: 'Challenge', subtitle: 'Connecting a Complex Governance Landscape',
        paragraphs: [
          'Multiple stakeholders. Diverse information. National-scale coordination.',
          'The platform needed to bring together conference proceedings, policy discussions, knowledge resources, programmes and institutional information within a single, intuitive digital environment.',
          'The challenge was not simply to organise information, but to make a complex governance ecosystem understandable, discoverable and accessible.'
        ], items: [], images: []
      },
      approach: {
        headingFirst: 'Our', headingSecond: 'Approach', subtitle: 'Designing for the Complexity of Governance',
        paragraphs: ['We approached the platform as a digital knowledge and collaboration ecosystem, rather than a conventional event website.'],
        items: [
          { title: 'Simplifying Complexity', description: 'Transforming extensive institutional information into clear and intuitive experiences.' },
          { title: 'Connecting Information and', description: 'Creating relationships between conferences, themes, initiatives, resources and outcomes.' },
          { title: 'Designing for Scale and', description: 'Building an experience capable of evolving with future conferences, programmes and governance initiatives.' }
        ], images: []
      },
      transformation: {
        headingFirst: 'The', headingSecond: 'Transformation', subtitle: 'A Digital Home for Collaborative Governance',
        paragraphs: ['We transformed the existing digital experience into a comprehensive governance and knowledge-sharing platform, bringing critical information and institutional resources together within a unified ecosystem.', 'The platform enables:'],
        items: [
          { description: 'Centralised access to institutional knowledge and resources.' },
          { description: 'Clear connections between conferences, themes, programmes and outcomes.' },
          { description: 'A scalable digital experience for future governance initiatives.' }
        ], images: []
      },
      impact: {
        headingFirst: 'Impact at a', headingSecond: 'Glance', subtitle: 'Building the Digital Infrastructure for Institutional Knowledge',
        paragraphs: ['The transformation created a stronger digital foundation for the National Conference of Chief Secretaries, enabling centralised knowledge access, improved information discoverability and a more connected digital experience across the governance ecosystem.'],
        items: [], images: []
      },
      certifications: {
        headingFirst: 'Recognition and', headingSecond: 'Certifications', paragraphs: [], items: [], images: [],
        quote: 'Recognized for delivering a scalable and impactful digital platform that strengthened knowledge sharing and collaborative governance across stakeholders.'
      },
      relatedProjectIds: [],
      branding: { overview: '', typography: '', colors: [], theme: '', logoDesign: '' }
    };
  }


private loadPageContent(projectId: string): void {
  this.http
    .get<Partial<PageContent>>(
      `${this.apiUrl}/${encodeURIComponent(projectId)}/detail-page`
    )
    .pipe(
      catchError(err => {
        console.error(
          'Edit Page content request failed:',
          err.status,
          err.error
        );

        this.error =
          err?.status === 404
            ? 'The detail-page API is unavailable. Check the deployed backend route.'
            : err?.error?.message ||
              'Unable to load saved page content.';

        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    )
    .subscribe(saved => {
      this.page = this.mergePage(
        this.createDefaultPage(),
        saved ?? {}
      );

      this.draft = this.clone(this.page);
    });
}


  private loadAvailableProjects(): void {
    this.http.get<any[]>(this.apiUrl).pipe(catchError(() => of([]))).subscribe(items => {
      this.availableProjects = (items ?? [])
        .map(item => ({ ...item, id: String(item.id ?? item._id ?? '') }) as EditableProject)
        .filter(p => p.id && p.id !== this.project?.id);
    });
  }

  private mergePage(base: PageContent, saved: Partial<PageContent>): PageContent {
    const mergeSection = (original: EditableSection, update?: Partial<EditableSection>): EditableSection => ({
      ...original, ...(update ?? {}),
      paragraphs: update?.paragraphs ?? original.paragraphs,
      items: update?.items ?? original.items,
      images: update?.images ?? original.images
    });
    return {
      ...base, ...saved,
      overview: { ...base.overview, ...(saved.overview ?? {}) },
      context: mergeSection(base.context, saved.context),
      challenge: mergeSection(base.challenge, saved.challenge),
      approach: mergeSection(base.approach, saved.approach),
      transformation: mergeSection(base.transformation, saved.transformation),
      impact: mergeSection(base.impact, saved.impact),
      certifications: mergeSection(base.certifications, saved.certifications),
      relatedProjectIds: saved.relatedProjectIds ?? base.relatedProjectIds,
      branding: { ...base.branding, ...(saved.branding ?? {}), colors: saved.branding?.colors ?? base.branding.colors }
    };
  }

  selectTab(tab: string): void { this.activeTab = tab; }

  startEdit(section: string): void {
    this.saveError = ''; this.saveSuccess = ''; this.sectionErrors = {};
    this.draft = this.clone(this.page);
    this.editingSection = section;
  }

  cancelEdit(): void {
    this.draft = this.clone(this.page);
    this.editingSection = null;
    this.saveError = ''; this.sectionErrors = {};
  }

  saveSection(section: string): void {
    const id = this.project?.id;
    if (!id) { this.saveError = 'Project ID is missing. Changes were not saved.'; return; }
    if (this.savingSection) return;
    const payload = section === 'related'
      ? { relatedProjectIds: [...this.selectedRelatedProjectIds] }
      : { [section]: this.clone((this.draft as any)[section]) };
    this.savingSection = section;
    this.saveError = ''; this.saveSuccess = ''; this.sectionErrors[section] = '';
    this.http.patch<any>(`${this.apiUrl}/${encodeURIComponent(id)}/detail-page/${encodeURIComponent(section)}`, payload)
      .pipe(finalize(() => this.savingSection = null))
      .subscribe({
        next: response => {
          if (section === 'related') this.page.relatedProjectIds = [...this.selectedRelatedProjectIds];
          else (this.page as any)[section] = this.clone((this.draft as any)[section]);
          if (response?.[section] && section !== 'related') (this.page as any)[section] = { ...(this.page as any)[section], ...response[section] };
          this.draft = this.clone(this.page);
          this.editingSection = null;
          this.saveSuccess = 'Changes saved successfully.';
          this.sectionErrors[section] = '';
          if (section === 'related') this.showAssociateProjects = false;
        },
        error: err => {
          const message = err?.error?.message || `Could not save ${section}. Your changes are still in the editor. Please try again.`;
          this.saveError = message;
          this.sectionErrors[section] = message;
        }
      });
  }

  selectImage(event: Event, section: 'overview', field: 'clientLogo'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.saveError = 'Please select an image file.'; input.value = ''; return; }
    this.readImage(file).then(src => this.draft[section][field] = src)
      .catch(() => this.saveError = 'Unable to read the selected image.')
      .finally(() => input.value = '');
  }

  selectMultipleImages(event: Event, section: 'context' | 'certifications', field: 'images'): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter(file => file.type.startsWith('image/'));
    const remaining = section === 'certifications' ? Math.max(0, 2 - this.draft.certifications.images.length) : files.length;
    const chosen = files.slice(0, remaining);
    Promise.all(chosen.map(file => this.readImage(file))).then(sources => {
      this.draft[section][field].push(...sources.map((src, i) => ({ src, alt: chosen[i]?.name ?? '' })));
      if (section === 'certifications') this.draft.certifications.images = this.draft.certifications.images.slice(0, 2);
    }).catch(() => this.saveError = 'Unable to read one or more selected images.')
      .finally(() => input.value = '');
  }

  private readImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image.'));
      reader.onerror = () => reject(reader.error ?? new Error('Could not read image.'));
      reader.readAsDataURL(file);
    });
  }

  addItem(section: 'approach' | 'transformation' | 'impact', field: 'items'): void {
    this.draft[section][field].push({ title: section === 'transformation' ? undefined : '', description: '' });
  }

  removeItem(section: 'context' | 'approach' | 'transformation' | 'impact' | 'certifications', field: 'items' | 'images', index: number): void {
    (this.draft[section] as any)[field].splice(index, 1);
  }

  moveItem(section: 'context' | 'approach' | 'transformation' | 'impact', field: 'items' | 'images', index: number, direction: -1 | 1): void {
    const list = (this.draft[section] as any)[field] as unknown[];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
  }

  private richTextTarget: HTMLElement | null = null;
  setRichTextTarget(event: FocusEvent): void { this.richTextTarget = event.target as HTMLElement; }

  updateRichText(event: Event, section: 'context' | 'challenge' | 'approach' | 'transformation' | 'impact', paragraphIndex: number): void {
    this.draft[section].paragraphs[paragraphIndex] = (event.target as HTMLElement).innerHTML;
  }

  formatRichText(section: 'context' | 'challenge' | 'approach' | 'transformation' | 'impact', paragraphIndex: number, format: 'bold' | 'italic' | 'underline'): void {
    const editor = this.richTextTarget;
    if (!editor) return;
    editor.focus();
    document.execCommand(format, false);
    this.draft[section].paragraphs[paragraphIndex] = editor.innerHTML;
  }

  openAssociateProjects(): void {
    this.selectedRelatedProjectIds = [...this.page.relatedProjectIds];
    this.showAssociateProjects = true;
    this.saveError = '';
  }

  closeAssociateProjects(): void {
    this.showAssociateProjects = false;
    this.selectedRelatedProjectIds = [...this.page.relatedProjectIds];
  }

  isAssociated(id: string): boolean { return this.selectedRelatedProjectIds.includes(id); }

  toggleAssociated(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked && !this.selectedRelatedProjectIds.includes(id)) this.selectedRelatedProjectIds.push(id);
    if (!checked) this.selectedRelatedProjectIds = this.selectedRelatedProjectIds.filter(item => item !== id);
  }

  saveRelatedProjects(): void { this.saveSection('related'); }

  openPreview(): void {
    if (!this.project) return;
    const routeValue = this.project.slug || this.project.id;
    void this.router.navigate(['/projects', routeValue]);
  }

  goBack(): void { void this.router.navigate(['/admin/projects']); }

  safeHtml(value: string | null | undefined): SafeHtml {
    const cleaned = this.sanitizer.sanitize(1, value ?? '') ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.slider) return;
    this.pointerStartX = event.clientX;
    this.pointerStartScroll = this.slider.nativeElement.scrollLeft;
    this.isDragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }
  onPointerMove(event: PointerEvent): void {
    if (this.pointerStartX === null || !this.slider) return;
    this.slider.nativeElement.scrollLeft = this.pointerStartScroll - (event.clientX - this.pointerStartX);
  }
  onPointerUp(_event: PointerEvent): void { this.pointerStartX = null; this.isDragging = false; }
  onSlideItemClick(index: number, _event: MouseEvent): void { this.activeIndex = index; }
  nextSlide(): void {
    if (!this.slider) return;
    const items = this.slider.nativeElement.querySelectorAll<HTMLElement>('.item');
    if (!items.length) return;
    this.activeIndex = (this.activeIndex + 1) % items.length;
    items[this.activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
  previousSlide(): void {
    if (!this.slider) return;
    const items = this.slider.nativeElement.querySelectorAll<HTMLElement>('.item');
    if (!items.length) return;
    this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
    items[this.activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  private clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
  ngOnDestroy(): void { if (this.autoplayTimer) clearInterval(this.autoplayTimer); }
}
