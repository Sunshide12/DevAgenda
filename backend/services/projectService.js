/**
 * Project Service
 * Handles project-related database operations
 */

const supabase = require('../config/database');

class ProjectService {
    /**
     * Get all projects for a user
     */
    async getUserProjects(userId, status = null) {
        try {
            let query = supabase
                .from('projects')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }

    /**
     * Get project by ID
     */
    async getProjectById(projectId, userId) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching project:', error);
            throw error;
        }
    }

    /**
     * Create a new project
     */
    async createProject(projectData) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([projectData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    /**
     * Update project
     */
    async updateProject(projectId, userId, updates) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', projectId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    }

    /**
     * Delete project
     */
    async deleteProject(projectId, userId) {
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }

    /**
     * Get projects grouped by status
     */
    async getProjectsByStatus(userId) {
        try {
            const projects = await this.getUserProjects(userId);
            
            return {
                por_hacer: projects.filter(p => p.status === 'POR_HACER'),
                futuro: projects.filter(p => p.status === 'FUTURO'),
                en_curso: projects.filter(p => p.status === 'EN_CURSO'),
                completado: projects.filter(p => p.status === 'COMPLETADO')
            };
        } catch (error) {
            console.error('Error grouping projects by status:', error);
            throw error;
        }
    }
}

module.exports = new ProjectService();

